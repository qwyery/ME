// backend/src/main/java/com/me/v1/Application.java
package com.me.v1;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import springfox.documentation.oas.annotations.EnableOpenApi;

@SpringBootApplication
@EnableOpenApi
public class MeApplication {
    public static void main(String[] args) {
        SpringApplication.run(MeApplication.class, args);
        System.out.println("MeApplication started");
    }
}
