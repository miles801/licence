package com.michael.licence;

import java.util.Date;
import java.util.Set;

/**
 * Licence
 * 验证方式：读取lic.xml
 * 读取文件内容：
 * 使用者
 * 最大用户数
 * 主机MAC地址：
 * 开始时间
 * 结束时间
 *
 * @author Michael
 */
public interface Licence {

    /**
     * 使用者名称
     */
    String getUsername();

    /**
     * 最大用户数
     */
    Integer getMaxUser();

    /**
     * 主机Mac地址
     */
    Set<String> getMacAddress();

    /**
     * licence有效期的起始时间
     */
    Date getStartDate();

    /**
     * licence有效期的截止时间
     */
    Date getEndDate();

}
