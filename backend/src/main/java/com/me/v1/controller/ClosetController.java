package com.me.v1.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.me.v1.model.ClothingItem;
import com.me.v1.model.ErrorResponse;
import com.me.v1.service.ClosetService;
import com.me.v1.service.OutfitRecommendationService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Api(tags = "衣橱管理接口")
@RestController
@RequestMapping("/api/closet")
public class ClosetController {

    private static final Logger log = LoggerFactory.getLogger(ClosetController.class);

    @Autowired
    private ClosetService closetService;

    @Autowired
    private OutfitRecommendationService outfitRecommendationService;

    @PostMapping
    public ResponseEntity<String> createClothingItem(@RequestBody ClothingItem item) {
        try {
            closetService.addClothingItem(item);
            return ResponseEntity.ok("Clothing item created successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating clothing item: " + e.getMessage());
        }
    }

    @ApiOperation("获取衣物列表")
    @GetMapping
    public ResponseEntity<?> getClothingItems(
            @ApiParam("页码") @RequestParam(value = "pageNum", defaultValue = "1") int pageNum,
            @ApiParam("每页大小") @RequestParam(value = "pageSize", defaultValue = "10") int pageSize,
            @ApiParam("衣物类别") @RequestParam(value = "category", required = false) String category) {
        try {
            Page<ClothingItem> items = closetService.listClothingItems(pageNum, pageSize, category);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            log.error("获取衣物列表失败", e);
            return ResponseEntity
                .status(500)
                .body(new ErrorResponse("获取衣物列表失败", e.getMessage()));
        }
    }

    @ApiOperation("获取单个衣物")
    @GetMapping("/{id}")
    public ResponseEntity<ClothingItem> getClothingItem(@PathVariable Long id) {
        ClothingItem item = closetService.getClothingItem(id);
        if (item != null) {
            return ResponseEntity.ok(item);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateClothingItem(@PathVariable Long id, @RequestBody ClothingItem item) {
        try {
            item.setId(id);
            closetService.updateClothingItem(item);
            return ResponseEntity.ok("Clothing item updated successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating clothing item: " + e.getMessage());
        }
    }

    @ApiOperation("删除衣物")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteClothingItem(@PathVariable Long id) {
        try {
            closetService.deleteClothingItem(id);
            return ResponseEntity.ok("Clothing item deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting clothing item: " + e.getMessage());
        }
    }

    @GetMapping("/outfit-recommendation")
    public List<ClothingItem> getOutfitRecommendation() {
        return outfitRecommendationService.getTodayOutfitRecommendation();
    }
}