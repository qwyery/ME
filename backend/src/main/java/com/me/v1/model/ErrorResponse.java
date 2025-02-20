package com.me.v1.model;

import lombok.Data;

@Data
public class ErrorResponse {
    private String message;
    private String detail;

    public ErrorResponse(String message, String detail) {
        this.message = message;
        this.detail = detail;
    }
} 