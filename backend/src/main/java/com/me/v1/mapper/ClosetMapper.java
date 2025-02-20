package com.me.v1.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.me.v1.model.ClothingItem;

import org.apache.ibatis.annotations.Mapper;


@Mapper
public interface ClosetMapper extends BaseMapper<ClothingItem> {

} 