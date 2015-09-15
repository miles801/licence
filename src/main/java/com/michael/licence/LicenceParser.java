package com.michael.licence;

import java.text.SimpleDateFormat;
import java.util.Set;

/**
 * 解析Licence对象，获取字符串信息
 *
 * @author Michael
 */
class LicenceParser {
    /**
     * 解析Licence对象，获取文本信息
     */
    public static String parse(Licence licence) {
        if (licence == null) {
            throw new NullPointerException();
        }
        StringBuilder builder = new StringBuilder(200);
        // 获取用户名
        builder.append(licence.getUsername());

        // 获取最大用户数
        builder.append(licence.getMaxUser());

        // 获取物理地址
        Set<String> macAddressSet = licence.getMacAddress();
        if (macAddressSet != null && !macAddressSet.isEmpty()) {
            for (String ip : macAddressSet) {
                builder.append(ip);
            }
        }
        // 获取开始时间
        SimpleDateFormat format = new SimpleDateFormat("yyyyMMdd");
        builder.append(format.format(licence.getStartDate()));

        // 获取截止时间
        builder.append(format.format(licence.getEndDate()));

        // 添加版本号
        String version = licence.getVersion();
        if (!LicenceImpl.VERSION.equals(version)) {
            throw new SecurityException("不合法的Licence文件，版本号不匹配!");
        }
        builder.append(version);

        return builder.toString();
    }
}
