package com.me.v1.service;

import com.me.v1.model.ClothingItem;
import com.me.v1.util.SeasonUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Service
public class OutfitRecommendationService {

    private final WeatherService weatherService;
    private final ClosetService closetService;

    public List<ClothingItem> getTodayOutfitRecommendation() {
        WeatherService.WeatherData weatherData = weatherService.getWeatherData();
        double temperature = weatherData.getMain().getTemp() - 273.15; // Convert Kelvin to Celsius
        int humidity = weatherData.getMain().getHumidity();
        String season = SeasonUtils.getSeason(temperature, humidity);
        String weatherType = weatherData.getWeather()[0].getMain();
        List<ClothingItem> clothingItems = closetService.listClothingItems();
        List<ClothingItem> collect = clothingItems.stream().filter(item -> {
            return item.getSeason().contains(season);
        }).collect(Collectors.toList());
        return collect;
    }




}
