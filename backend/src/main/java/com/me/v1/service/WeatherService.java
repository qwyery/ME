package com.me.v1.service;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
public class WeatherService {

    private static final String API_KEY = "a32fbca97e374046e7202cd22423aad2";
    private static final String WEATHER_URL = "http://api.openweathermap.org/data/2.5/weather?q=Beijing&appid=a32fbca97e374046e7202cd22423aad2";

    private final RestTemplate restTemplate;


    public WeatherData getWeatherData() {
        return restTemplate.getForObject(WEATHER_URL, WeatherData.class, "Beijing", API_KEY);
    }

    @Data
    public static class WeatherData {
        private Main main;
        private Weather[] weather;

        @Data
        public static class Main {
            private double temp;
            private int humidity;
        }

        @Data
        public static class Weather {
            private String main; // e.g., "Rain", "Clear"
            private String description;
        }
    }

    public static void main(String[] args) {
        RestTemplate restTemplate = new RestTemplate();
        WeatherService weatherService = new WeatherService(restTemplate);

        WeatherData weatherData = weatherService.getWeatherData();

        if (weatherData != null) {
            double tempCelsius = weatherData.getMain().getTemp() - 273.15; // 转换为摄氏度
            int humidity = weatherData.getMain().getHumidity();
            String weatherCondition = weatherData.getWeather()[0].getMain();

            System.out.println("Temperature: " + tempCelsius + "°C");
            System.out.println("Humidity: " + humidity + "%");
            System.out.println("Weather Condition: " + weatherCondition);
        } else {
            System.out.println("Failed to fetch weather data.");
        }
    }
}
