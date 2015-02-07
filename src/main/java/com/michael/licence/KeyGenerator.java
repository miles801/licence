package com.michael.licence;

import java.io.UnsupportedEncodingException;

/**
 * Licence的Key的生成器
 *
 * @author Michael
 */
final class KeyGenerator {
    // "上海优创优创融联计算机科技有限公司".getBytes("utf-8")
    private static byte[] keys = new byte[]{
            -28, -72, -118, -26, -75, -73, -28, -68, -104, -27, -120, -101, -24, -98, -115, -24, -127, -108, -24, -82, -95, -25, -82, -105, -26, -100, -70, -25, -89, -111, -26, -118, -128, -26, -100, -119, -23, -103, -112, -27, -123, -84, -27, -113, -72
    };

    /**
     * 根据描述信息，生成licence的key
     *
     * @param message 描述信息
     */
    protected static String buildKey(String message) {
        if (message == null || "".equals(message.trim())) {
            throw new RuntimeException("Key的描述信息不能为空!生成Key失败!");
        }
        String _ = null;
        try {
            _ = new String(keys, "utf-8");
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
        String key = MD5Utils.encode(_ + message).substring(0, 30).toUpperCase();
        StringBuilder buffer = new StringBuilder(30);
        char tmp[] = key.toCharArray();
        for (int i = 0; i < tmp.length; i++) {
            if (i % 5 == 0 && i > 0) {
                buffer.append("-");
            }
            buffer.append(tmp[i]);
        }
        return buffer.toString();
    }
}
