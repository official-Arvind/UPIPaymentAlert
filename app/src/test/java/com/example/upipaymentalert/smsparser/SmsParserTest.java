package com.example.upipaymentalert.smsparser;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class SmsParserTest {

    @Test
    public void parsesWholeRupeeAmountsWithoutCrashing() {
        SmsParser parser = new SmsParser();

        String result = parser.getAmountFromMessageBody("Your payment of Rs 10 was received");

        assertEquals("Received payment of 10 rupees", result);
    }

    @Test
    public void parsesDecimalAmountsWithPaise() {
        SmsParser parser = new SmsParser();

        String result = parser.getAmountFromMessageBody("Your payment of INR 100.25 was received");

        assertEquals("Received payment of 100 rupees and 25 paisa", result);
    }
}
