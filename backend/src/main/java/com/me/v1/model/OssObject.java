package com.me.v1.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.util.Date;

@Data
@TableName("oss")
public class OssObject {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String fileName;    // 文件名
    private String contentType; // 文件类型
    private String base64Content; // Base64编码的文件内容
    private Long fileSize;      // 文件大小
    private Date createTime;    // 创建时间
    private Date updateTime;    // 更新时间
} 