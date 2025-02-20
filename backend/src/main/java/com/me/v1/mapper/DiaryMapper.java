package com.me.v1.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.me.v1.model.DiaryEntry;
import org.apache.ibatis.annotations.Mapper;


@Mapper
public interface DiaryMapper extends BaseMapper<DiaryEntry> {
    DiaryEntry selectByDate(String date); // 根据日期查找日记
} 