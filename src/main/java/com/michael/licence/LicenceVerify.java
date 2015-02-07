package com.michael.licence;

/**
 * licence验证器
 *
 * @author Michael
 */
public class LicenceVerify {
    private static LicenceVerify verify = new LicenceVerify();

    private LicenceVerify() {

    }

    public static LicenceVerify getInstance() {
        return verify;
    }

    /**
     * 验证Licence是否为有效的
     * 如果有效，则返回Licence信息，否则返回null
     */
    public Licence isValidLicence() {
        Licence licence = LicenceLoader.getInstance().getLicence();
        String licenceDescription = LicenceParser.parse(licence);
        String key = ((LicenceImpl) licence).getKey();
        return key.equals(KeyGenerator.buildKey(licenceDescription)) ? licence : null;
    }
}
