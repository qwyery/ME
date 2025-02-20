// backend/src/main/java/com/me/v1/model/ClothingItem.java
package com.me.v1.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;

import com.me.v1.handler.StringListJsonTypeHandler;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
@TableName("clothing_item")
public class ClothingItem {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String name; // 衣物名称
    private String category; // 衣物类别，改为 String 类型
    private String brand; // 品牌
    private String color; // 颜色
    @TableField(typeHandler = StringListJsonTypeHandler.class)
    private List<String> season; // 适用季节
    private String description; // 描述
    private String imageUrl; // 图片URL
    private Date purchaseDate; // 购买日期
    private Date createTime; // 创建时间
    private Date updateTime; // 更新时间


}