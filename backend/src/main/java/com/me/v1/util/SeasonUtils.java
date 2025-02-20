package com.me.v1.util;

public class SeasonUtils {

    /**
     * 根据温度和湿度判断季节
     *
     * @param temperature 温度（摄氏度）
     * @param humidity    湿度（百分比，0-100）
     * @return 季节名称（Spring, Summer, Autumn, Winter）
     */
    public static String getSeason(double temperature, int humidity) {
        if (temperature >= 25 && humidity >= 60) {
            return "Summer"; // 夏季：高温高湿
        } else if (temperature < 13 && humidity < 50) {
            return "Winter"; // 冬季：低温低湿
        } else if (temperature >= 13 && temperature < 25 && humidity >= 50) {
            return "Spring"; // 春季：温度适中，湿度适中
        } else if (temperature >= 13 && temperature < 25 && humidity < 50) {
            return "Fall"; // 秋季：温度适中，湿度较低
        } else {
            return "Unknown"; // 无法确定季节
        }
    }

    public static void main(String[] args) {
        // 测试示例
        System.out.println(getSeason(28, 70)); // Summer
        System.out.println(getSeason(15, 55)); // Spring
        System.out.println(getSeason(18, 40)); // Fall
        System.out.println(getSeason(5, 30));  // Winter
        System.out.println(getSeason(22, 45)); // Fall
    }
}
