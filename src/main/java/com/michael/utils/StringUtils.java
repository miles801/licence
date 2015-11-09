package com.michael.utils;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

/**
 * @author Michael
 */
public class StringUtils {
    public static String decodeUTF8(String string) {
        if (string == null || "".equals(string)) {
            return string;
        }
        try {
            return URLDecoder.decode(URLDecoder.decode(string, "utf-8"), "utf-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        return null;
    }
}
