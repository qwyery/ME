// backend/src/main/java/com/me/v1/service/ClosetService.java
package com.me.v1.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.me.v1.mapper.ClosetMapper;
import com.me.v1.model.ClothingItem;

import java.util.Date;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ClosetService {
    private static final Logger log = LoggerFactory.getLogger(ClosetService.class);

    @Autowired
    private ClosetMapper closetMapper;

    public void addClothingItem(ClothingItem item) {
        try {
            Date now = new Date();
            if (item.getCreateTime() == null) {
                item.setCreateTime(now);
            }
            if (item.getUpdateTime() == null) {
                item.setUpdateTime(now);
            }
            closetMapper.insert(item);
        } catch (Exception e) {
            log.error("添加衣物失败: {}", e.getMessage(), e);
            throw new RuntimeException("添加衣物失败: " + e.getMessage());
        }
    }

    public void updateClothingItem(ClothingItem item) {
        item.setUpdateTime(new Date());
        closetMapper.updateById(item);
    }

    public void deleteClothingItem(Long id) {
        closetMapper.deleteById(id);
    }

    public ClothingItem getClothingItem(Long id) {
        return closetMapper.selectById(id);
    }

    public Page<ClothingItem> listClothingItems(int pageNum, int pageSize, String category) {
        try {
            Page<ClothingItem> page = new Page<>(pageNum, pageSize);
            LambdaQueryWrapper<ClothingItem> wrapper = new LambdaQueryWrapper<>();
            if (category != null) {
                wrapper.eq(ClothingItem::getCategory, category);
            }
            return closetMapper.selectPage(page, wrapper);
        } catch (Exception e) {
            log.error("查询衣物列表失败: {}", e.getMessage(), e);
            throw new RuntimeException("查询衣物列表失败: " + e.getMessage());
        }
    }

    public List<ClothingItem> listClothingItems() {
        return closetMapper.selectList(null);
    }

   
}