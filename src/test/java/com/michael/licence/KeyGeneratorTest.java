package com.michael.licence;

import org.junit.Assert;
import org.junit.Test;

import java.util.logging.Logger;

/**
 * @author Michael
 */
public class KeyGeneratorTest {
    private Logger logger = Logger.getLogger(KeyGeneratorTest.class.getName());

    @Test
    public void testBuildKey() throws Exception {
        logger.info("生成Licence的Key...");
        Licence licence = LicenceLoader.getInstance().getLicence();
        String licenceDescription = LicenceParser.parse(licence);
        String key = KeyGenerator.buildKey(licenceDescription);
        System.out.println(key);
        Assert.assertNotNull(key);
    }

    @Test
    public void testVerify() throws Exception {
        logger.info("验证Licence文件是否合法...");
        Licence licence = LicenceVerify.getInstance().isValidLicence();
        String info = LicenceParser.parse(licence);
        String key = KeyGenerator.buildKey(info);
        Assert.assertEquals(key, ((LicenceImpl) licence).getKey());
        System.out.println(key);
    }
}
