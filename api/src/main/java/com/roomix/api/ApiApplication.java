package com.roomix.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ApiApplication {

	static {
		System.setProperty("java.net.preferIPv4Stack", "false");
		System.setProperty("java.net.preferIPv6Addresses", "true");
	}

	public static void main(String[] args) {
		SpringApplication.run(ApiApplication.class, args);
	}

}
