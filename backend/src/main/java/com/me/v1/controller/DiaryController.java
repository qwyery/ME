package com.me.v1.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.me.v1.model.DiaryEntry;
import com.me.v1.service.DiaryService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;

import java.text.ParseException;

@Api(tags = "日记管理接口")
@RestController
@RequestMapping("/api/diary")
public class DiaryController {

    private static final Logger logger = LoggerFactory.getLogger(DiaryController.class);

    @Autowired
    private DiaryService diaryService;

    @PostMapping("/save")
    public ResponseEntity<String> saveDiary(@RequestBody DiaryEntry diaryEntry) {
    
        if (diaryEntry.getDate() == null || diaryEntry.getContent() == null) {
            return ResponseEntity.badRequest().body("date or content is null");
        }

        try {
            diaryService.saveOrUpdateDiary(diaryEntry);
            return ResponseEntity.ok("diary saved successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("error when saving diary");
        }
    }

    @GetMapping()
    public ResponseEntity<DiaryEntry> getDiaryEntries(@RequestParam String date) throws ParseException {

        DiaryEntry entries = diaryService.findByDate(date);
        return ResponseEntity.ok(entries);
    }

    @ApiOperation("获取所有历史日记")
    @GetMapping("/list")
    public ResponseEntity<Page<DiaryEntry>> listDiaries(
            @ApiParam("页码") @RequestParam(defaultValue = "1") int pageNum,
            @ApiParam("每页大小") @RequestParam(defaultValue = "10") int pageSize) {
        try {
            logger.info("查询历史日记列表, pageNum: {}, pageSize: {}", pageNum, pageSize);
            Page<DiaryEntry> diaries = diaryService.listDiaries(pageNum, pageSize);
            return ResponseEntity.ok(diaries);
        } catch (Exception e) {
            logger.error("查询历史日记列表失败: {}", e.getMessage());
            return ResponseEntity.status(500).build();
        }
    }
}