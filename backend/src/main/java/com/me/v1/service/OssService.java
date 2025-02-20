package com.me.v1.service;

import com.me.v1.mapper.OssMapper;
import com.me.v1.model.OssObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Base64;
import java.util.Date;

@Service
public class OssService {
    
    @Autowired
    private OssMapper ossMapper;

    public Long uploadFile(MultipartFile file) throws Exception {
        OssObject ossObject = new OssObject();
        ossObject.setFileName(file.getOriginalFilename());
        ossObject.setContentType(file.getContentType());
        ossObject.setFileSize(file.getSize());
        
        // 将文件内容转换为Base64
        String base64Content = Base64.getEncoder().encodeToString(file.getBytes());
        ossObject.setBase64Content(base64Content);
        
        Date now = new Date();
        ossObject.setCreateTime(now);
        ossObject.setUpdateTime(now);
        
        ossMapper.insert(ossObject);
        return ossObject.getId();
    }

    public OssObject getFile(Long id) {
        return ossMapper.selectById(id);
    }
} 