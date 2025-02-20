package com.me.v1.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("goal")
public class Goal {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String title;
    private String description;
    private String type; // CAREER - 主业目标, HOBBY - 兴趣爱好目标
    private String status; // IN_PROGRESS, COMPLETED, ABANDONED
    private Date startDate;
    private Date endDate;
    private Date createTime;
    private Date updateTime;
    private String plan;
} 