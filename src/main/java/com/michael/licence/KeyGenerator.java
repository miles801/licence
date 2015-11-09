package com.michael.licence;

/**
 * Licence的Key的生成器
 *
 * @author Michael
 */
final class KeyGenerator {

    /**
     * 根据描述信息，生成licence的key
     *
     * @param message 描述信息
     */
    protected static String buildKey(String message) {
        if (message == null || "".equals(message.trim())) {
            throw new RuntimeException("Key的描述信息不能为空!生成Key失败!");
        }
        String key = MD5Utils.encode("ulane.com.cn" + message).substring(0, 30).toUpperCase();
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
