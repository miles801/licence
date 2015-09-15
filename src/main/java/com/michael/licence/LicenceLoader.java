package com.michael.licence;

import org.dom4j.Attribute;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.Element;
import org.dom4j.io.SAXReader;

import java.io.InputStream;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Licence加载器，默认加载classpath下的lic.xml
 * @author Michael
 */
final class LicenceLoader {
    private static Element root = null;

    static {
        SAXReader reader = new SAXReader();
        try {
            InputStream inputStream = LicenceLoader.class.getClassLoader().getResourceAsStream("lic.xml");
            if (inputStream == null) {
                throw new SecurityException("没有发现lic.xml文件!");
            }
            Document document = reader.read(inputStream);
            root = document.getRootElement(); // 获取根节点
        } catch (DocumentException e) {
            e.printStackTrace();
        }
    }

    private static LicenceLoader loader = new LicenceLoader();
    private LicenceImpl licence = null;
    private SimpleDateFormat format = new SimpleDateFormat("yyyyMMdd");


    private Date getStartDate() {
        String startDate = root.elementTextTrim("startDate");
        if (isBlank(startDate)) {
            throw new SecurityException("不合法的Licence文件，缺少<startDate>标签!");
        }
        if (!startDate.matches("\\d{8}")) {
            throw new SecurityException("不合法的Licence文件，时间格式只能是{yyyyMMdd}!");
        }
        try {
            return format.parse(startDate);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return null;
    }


    private Integer getMaxUser() {
        String maxUser = root.elementTextTrim("maxUser");
        if (isBlank(maxUser)) {
            throw new SecurityException("不合法的Licence文件，缺少<maxUser>标签!");
        }
        if (!maxUser.matches("\\d+")) {
            throw new SecurityException("不合法的Licence文件，最大用户数只能是正整数!");
        }
        return Integer.parseInt(maxUser);
    }

    private Set<String> getMacAddress() {
        Element macAddress = root.element("macAddress");
        if (macAddress == null) {
            throw new SecurityException("不合法的Licence文件，缺少<macAddress>标签!");
        }
        Set<String> macAddressSet = new HashSet<String>();
        Attribute attribute = macAddress.attribute("limit");
        if (attribute != null && "false".equals(attribute.getValue())) {
            macAddressSet.add("ALL");
        } else {
            List<Element> ipList = macAddress.elements("ip");
            if (ipList != null && !ipList.isEmpty()) {
                for (Element element : ipList) {
                    macAddressSet.add(element.getTextTrim());
                }
            }
        }
        return macAddressSet;
    }

    private LicenceLoader() {
        licence = new LicenceImpl();
        // 获取名称
        String name = getName();
        licence.setUsername(name);

        // 获取Mac地址
        Set<String> macAddressSet = getMacAddress();
        licence.setMacAddress(macAddressSet);


        // 获取最大用户数
        Integer maxUser = getMaxUser();
        licence.setMaxUser(maxUser);

        // 获取开始时间

        Date startDate = getStartDate();
        licence.setStartDate(startDate);

        // 获取截止时间
        Date endDate = getEndDate();
        licence.setEndDate(endDate);

        // 获取key
        String key = getKey();
        licence.setKey(key);

        // 获得版本
        String version = getVersion();
        licence.setVersion(version);
    }

    private String getVersion() {
        String version = root.elementTextTrim("version");
        if (isBlank(version)) {
            throw new SecurityException("不合法的Licence文件，缺少<version>标签!");
        }
        return version;
    }

    private String getName() {
        String name = root.elementTextTrim("name");
        if (isBlank(name)) {
            throw new SecurityException("不合法的Licence文件，缺少<name>标签!");
        }
        return name;
    }

    private Date getEndDate() {
        String endDate = root.elementTextTrim("endDate");
        if (isBlank(endDate)) {
            throw new SecurityException("不合法的Licence文件，缺少<endDate>标签!");
        }
        if (!endDate.matches("\\d{8}")) {
            throw new SecurityException("不合法的Licence文件，时间格式只能是{yyyyMMdd}!");
        }
        try {
            return format.parse(endDate);
        } catch (ParseException e) {
            e.printStackTrace();
        }
        return null;
    }

    private String getKey() {
        String key = root.elementTextTrim("key");
        if (isBlank(key)) {
            throw new SecurityException("不合法的Licence文件，缺少<key>标签!");
        }
        return key;
    }

    public static LicenceLoader getInstance() {
        return loader;
    }

    /**
     * 获取从配置文件中读取的Licence信息
     */
    protected Licence getLicence() {
        return licence;
    }

    private boolean isBlank(String string) {
        return string == null || "".equals(string.trim());
    }


}
