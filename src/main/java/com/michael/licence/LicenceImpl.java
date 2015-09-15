package com.michael.licence;

import java.util.Date;
import java.util.Set;

/**
 * @author Michael
 */
final class LicenceImpl implements Licence {
    /**
     * 版本
     */
    public static final String VERSION = "1.1";
    private String username;
    private Integer maxUser;
    private String key;
    private Date startDate;
    private Date endDate;
    private String version;
    private Set<String> macAddress;

    @Override
    public String getUsername() {

        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    @Override
    public Integer getMaxUser() {
        return maxUser;
    }

    public void setMaxUser(Integer maxUser) {
        this.maxUser = maxUser;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    @Override
    public Date getStartDate() {
        return startDate;
    }

    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    @Override
    public Date getEndDate() {
        return endDate;
    }

    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }


    @Override
    public Set<String> getMacAddress() {
        return macAddress;
    }

    public void setMacAddress(Set<String> macAddress) {
        this.macAddress = macAddress;
    }

    @Override
    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }
}
