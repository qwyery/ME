package com.me.v1.service.impl;

import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
import com.baomidou.mybatisplus.core.toolkit.ObjectUtils;
import com.me.v1.mapper.GoalMapper;
import com.me.v1.model.Goal;
import com.me.v1.service.GoalPlanningService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class GoalPlanningServiceImpl implements GoalPlanningService {
    private final GoalMapper goalMapper;
    private final RestTemplate restTemplate;
    private static final String CHATGLM_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
    // 替换为你的 API Key
    private static final String API_KEY = "18d3337826624aa0aa7ecb3fd6158a82.Vj9gpBURgUu6mnUl";

    

    @Override
    public Boolean generatePlan(Long id) {
        Goal goal = goalMapper.selectById(id);
        if (goal == null) {
            throw new RuntimeException("目标不存在");
        }
        
        // 计算总天数
        long totalDays = TimeUnit.DAYS.convert(
            goal.getEndDate().getTime() - goal.getStartDate().getTime(), 
            TimeUnit.MILLISECONDS
        );
        
        String plan = callChatGLMAPI(goal.getDescription(), goal.getStartDate(), goal.getEndDate(), totalDays);
        goal.setPlan(plan);
        goalMapper.updateById(goal);
        return true;
    }

    @SuppressWarnings("unchecked")
    private String callChatGLMAPI(String goalDescription, Date startDate, Date endDate, long totalDays) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + API_KEY);

        List<Map<String, String>> messages = new ArrayList<>();
        
        // 添加系统提示
        Map<String, String> systemMessage = new HashMap<>();
        systemMessage.put("role", "system");
        systemMessage.put("content", 
            "你是一个专业的目标规划助手。请根据用户的目标和时间范围，制定详细的阶段性计划。\n" +
            "请按照以下格式输出：\n" +
            "1. 总体目标概述\n" +
            "2. 分阶段计划（每个阶段包含具体时间段和任务）\n" +
            "3. 关键里程碑\n" +
            "4. 注意事项和建议");
        messages.add(systemMessage);

        // 格式化日期
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        
        // 添加用户问题
        Map<String, String> userMessage = new HashMap<>();
        userMessage.put("role", "user");
        userMessage.put("content", String.format(
            "请为以下目标制定详细的实施计划：\n" +
            "目标描述：%s\n" +
            "开始时间：%s\n" +
            "结束时间：%s\n" +
            "总计天数：%d天\n\n" +
            "请根据这个时间范围，将计划分为几个阶段，确保在结束日期前完成目标。\n" +
            "每个阶段都需要明确的时间段和具体任务。",
            goalDescription, 
            dateFormat.format(startDate), 
            dateFormat.format(endDate), 
            totalDays));
        messages.add(userMessage);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "glm-4");
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 2000);
        requestBody.put("stream", false);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        try {
            log.debug("Calling ChatGLM API with request: {}", requestBody);
            Map<String, Object> response = restTemplate.postForObject(
                CHATGLM_API_URL,
                request,
                Map.class
            );
            log.debug("Received response: {}", response);

            if (response != null && response.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            throw new RuntimeException("无法解析 API 响应: " + response);
        } catch (Exception e) {
            log.error("调用 AI 模型时发生错误", e);
            throw new RuntimeException("调用 AI 模型生成计划失败: " + e.getMessage());
        }
    }
} 