package com.me.v1.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.me.v1.mapper.GoalMapper;
import com.me.v1.model.Goal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
public class GoalService {
    
    @Autowired
    private GoalMapper goalMapper;

    // 创建目标
    public void createGoal(Goal goal) {
        goal.setCreateTime(new Date());
        goal.setUpdateTime(new Date());
        goalMapper.insert(goal);
    }

    // 更新目标
    public void updateGoal(Goal goal) {
        goal.setUpdateTime(new Date());
        goalMapper.updateById(goal);
    }

    // 删除目标
    public void deleteGoal(Long id) {
        goalMapper.deleteById(id);
    }

    // 获取单个目标
    public Goal getGoal(Long id) {
        return goalMapper.selectById(id);
    }

    // 获取所有目标（分页）
    public Page<Goal> listGoals(int pageNum, int pageSize, String type) {
        Page<Goal> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<Goal> wrapper = new LambdaQueryWrapper<>();
        if (type != null) {
            wrapper.eq(Goal::getType, type);
        }
        wrapper.orderByDesc(Goal::getCreateTime);
        return goalMapper.selectPage(page, wrapper);
    }
} 