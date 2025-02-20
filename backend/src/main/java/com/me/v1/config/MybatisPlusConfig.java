package com.me.v1.config;

import com.baomidou.mybatisplus.annotation.DbType;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.me.v1.mapper")
public class MybatisPlusConfig implements InitializingBean {

    @Autowired
    private SqlSessionFactory sqlSessionFactory;

    @Override
    public void afterPropertiesSet() {
        // 注册自定义的 TypeHandler
        //sqlSessionFactory.getConfiguration().getTypeHandlerRegistry()
        //    .register(com.me.v1.handler.SeasonListTypeHandler.class);
    }

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 添加分页插件
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.H2));
        return interceptor;
    }
} 