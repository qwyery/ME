package com.me.v1.config;

import com.me.v1.model.ClothingItem;
import com.me.v1.service.OutfitRecommendationService;
import com.me.v1.service.WeatherService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
