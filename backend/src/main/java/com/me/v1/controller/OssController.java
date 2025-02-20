package com.me.v1.controller;

import com.me.v1.model.OssObject;
import com.me.v1.service.OssService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Api(tags = "文件存储接口")
@RestController
@RequestMapping("/api/oss")
@CrossOrigin
public class OssController {
    
    private static final Logger log = LoggerFactory.getLogger(OssController.class);

    @Autowired
    private OssService ossService;

    @ApiOperation("上传文件")
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        log.info("Receiving file upload request: {}", file.getOriginalFilename());
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("File is empty");
        }
        
        try {
            Long ossId = ossService.uploadFile(file);
            Map<String, Object> response = new HashMap<>();
            response.put("ossId", ossId);
            response.put("fileName", file.getOriginalFilename());
            log.info("File uploaded successfully. OssId: {}", ossId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error uploading file", e);
            return ResponseEntity.status(500)
                    .body("Error uploading file: " + e.getMessage());
        }
    }

    @ApiOperation("获取文件")
    @GetMapping("/{id}")
    public ResponseEntity<?> getFile(@PathVariable Long id) {
        log.info("Receiving file download request for id: {}", id);
        
        try {
            OssObject ossObject = ossService.getFile(id);
            if (ossObject == null) {
                log.warn("File not found for id: {}", id);
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = Base64.getDecoder().decode(ossObject.getBase64Content());
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(ossObject.getContentType()))
                    .body(fileContent);
        } catch (Exception e) {
            log.error("Error retrieving file", e);
            return ResponseEntity.status(500)
                    .body("Error retrieving file: " + e.getMessage());
        }
    }
} 