// backend/src/main/java/com/me/v1/model/DiaryEntry.java
package com.me.v1.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import lombok.Data;

@Data
@TableName("diary_entry")
public class DiaryEntry {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String date;
    private String weather;
    private String mood;
    private String content;

}