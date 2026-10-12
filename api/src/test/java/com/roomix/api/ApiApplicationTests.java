package com.roomix.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApiApplicationTests {

	static {
		System.setProperty("java.net.preferIPv4Stack", "false");
		System.setProperty("java.net.preferIPv6Addresses", "true");
	}

	@Test
	void contextLoads() {
	}

}
