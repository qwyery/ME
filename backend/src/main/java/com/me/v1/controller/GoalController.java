package com.me.v1.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.me.v1.model.Goal;
import com.me.v1.service.GoalService;
import com.me.v1.dto.GoalPlanRequest;
import com.me.v1.dto.GoalPlanResponse;
import com.me.v1.service.GoalPlanningService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Api(tags = "目标管理接口")
@RestController
@RequestMapping("/api/goals")
public class GoalController {

    @Autowired
    private GoalService goalService;

    @Autowired
    private GoalPlanningService goalPlanningService;

    @ApiOperation("创建新目标")
    @PostMapping
    public ResponseEntity<String> createGoal(@RequestBody Goal goal) {
        try {
            goalService.createGoal(goal);
            return ResponseEntity.ok("Goal created successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating goal: " + e.getMessage());
        }
    }

    @ApiOperation("更新目标")
    @PutMapping("/{id}")
    public ResponseEntity<String> updateGoal(@PathVariable Long id, @RequestBody Goal goal) {
        try {
            goal.setId(id);
            goalService.updateGoal(goal);
            return ResponseEntity.ok("Goal updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating goal: " + e.getMessage());
        }
    }

    @ApiOperation("删除目标")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteGoal(@PathVariable Long id) {
        try {
            goalService.deleteGoal(id);
            return ResponseEntity.ok("Goal deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting goal: " + e.getMessage());
        }
    }

    @ApiOperation("获取单个目标")
    @GetMapping("/{id}")
    public ResponseEntity<Goal> getGoal(@PathVariable Long id) {
        Goal goal = goalService.getGoal(id);
        if (goal != null) {
            return ResponseEntity.ok(goal);
        }
        return ResponseEntity.notFound().build();
    }

    @ApiOperation("获取目标列表")
    @GetMapping
    public ResponseEntity<Page<Goal>> listGoals(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String type) {
        Page<Goal> goals = goalService.listGoals(pageNum, pageSize, type);
        return ResponseEntity.ok(goals);
    }

    @ApiOperation("获取目标的实现计划")
    @PostMapping("/plan")
    public ResponseEntity<GoalPlanResponse> generatePlan(@RequestParam Long id) {
        try {
            Goal goal = goalService.getGoal(id);
            if (goal == null) {
                return ResponseEntity.notFound().build();
            }
            
            GoalPlanResponse response = new GoalPlanResponse();
            response.setSuccess(goalPlanningService.generatePlan(id)); 
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            GoalPlanResponse response = new GoalPlanResponse();
            response.setSuccess(false);
            return ResponseEntity.status(500).body(response);
        }
    }
} 