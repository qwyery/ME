// backend/src/main/java/com/me/v1/service/DiaryService.java
package com.me.v1.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.me.v1.mapper.DiaryMapper;
import com.me.v1.model.DiaryEntry;
import com.me.v1.util.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.util.Date;


@Service
public class DiaryService {
    @Autowired
    private DiaryMapper diaryMapper;

    public void save(DiaryEntry entry) {
        diaryMapper.insert(entry);
    }

    public DiaryEntry findByDate(String date) throws ParseException {
        Date date1 = DateUtils.stringToDate(date);
        return diaryMapper.selectOne(new LambdaQueryWrapper<DiaryEntry>().eq(DiaryEntry::getDate, date1));
    }

    public void saveOrUpdateDiary(DiaryEntry diaryEntry) {
        DiaryEntry existingEntry = diaryMapper.selectOne(new LambdaQueryWrapper<DiaryEntry>().eq(DiaryEntry::getDate, diaryEntry.getDate()));
        if (existingEntry != null) {
            existingEntry.setWeather(diaryEntry.getWeather());
            existingEntry.setMood(diaryEntry.getMood());
            existingEntry.setContent(diaryEntry.getContent());
            diaryMapper.updateById(existingEntry);
        } else {
            diaryMapper.insert(diaryEntry);
        }
    }

    /**
     * 分页查询所有历史日记
     * @param pageNum 页码
     * @param pageSize 每页大小
     * @return 分页后的日记列表
     */
    public Page<DiaryEntry> listDiaries(int pageNum, int pageSize) {
        Page<DiaryEntry> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<DiaryEntry> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(DiaryEntry::getDate); // 按日期降序排序
        return diaryMapper.selectPage(page, wrapper);
    }
}