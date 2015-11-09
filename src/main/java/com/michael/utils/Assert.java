package com.michael.utils;

/**
 * @author Michael
 */
public class Assert {

    public static void hasText(String text) {
        hasText(text, null);
    }

    public static void hasText(String text, String errorMessage) {
        if (text == null || "".equals(text.trim())) {
            if (errorMessage == null) {
                errorMessage = "参数不能为空!";
            }
            throw new RuntimeException(errorMessage);
        }
    }

}
