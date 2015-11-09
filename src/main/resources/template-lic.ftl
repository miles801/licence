<?xml version="1.0" encoding="UTF-8"?>
<licence>
    <description>
        <![CDATA[
            该Licence由开发商提供，不得更改任何信息，否则可能导致Licence验证失败!
        ]]>
    </description>
    <name>${username}</name>

    <version>1.1.1</version>

    <macAddress>
        <#list macAddress as mac>
        <ip>${mac}</ip>
        </#list>
    </macAddress>

    <!-- 允许登录的最大用户数 -->
    <maxUser>${maxUser}</maxUser>

    <!-- 开始使用时间-->
    <startDate>${startDate?string('yyyyMMdd')}</startDate>

    <!-- 截止使用时间-->
    <endDate>${endDate?string('yyyyMMdd')}</endDate>

    <key>
        <![CDATA[
            ${key}
        ]]>
    </key>
</licence>