package com.michael.licence;

import com.michael.utils.StringUtils;
import freemarker.cache.StringTemplateLoader;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import org.apache.commons.io.IOUtils;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

/**
 * @author Michael
 */
public class LicenceServlet extends HttpServlet {
    @Override
    public void init() throws ServletException {
        super.init();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // 上传信息
        System.out.println("Servlet Do Post");

    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // 下载licence
        System.out.println("Servlet Do Get");
        LicenceImpl licence = new LicenceImpl();
        licence.setVersion("1.1.1");
        String name = StringUtils.decodeUTF8(request.getParameter("name"));
        licence.setUsername(name);
        String maxUser = request.getParameter("maxUser");
        licence.setMaxUser(Integer.parseInt(maxUser));
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd");
        String startDate = request.getParameter("startDate");
        String endDate = request.getParameter("endDate");
        try {
            licence.setEndDate(format.parse(endDate));
            licence.setStartDate(format.parse(startDate));
        } catch (ParseException e) {
            e.printStackTrace();
        }
        String macAddress[] = StringUtils.decodeUTF8(request.getParameter("macAddress")).split(",");
        Set<String> set = new HashSet<String>();
        Collections.addAll(set, macAddress);
        licence.setMacAddress(set);
        String licenceDescription = LicenceParser.parse(licence);
        String key = KeyGenerator.buildKey(licenceDescription);
        licence.setKey(key);

        // 生成licence文件
        String lic = IOUtils.toString(LicenceServlet.class.getClassLoader().getResourceAsStream("template-lic.ftl"), "utf-8");
        Configuration configuration = new Configuration();
        StringTemplateLoader templateLoader = new StringTemplateLoader();
        templateLoader.putTemplate("licence", lic);
        configuration.setTemplateLoader(templateLoader);
        Template template = configuration.getTemplate("licence");
        response.setCharacterEncoding("utf-8");
        String disposition = "attachment;filename=lic.xml";
        response.setContentType("application/xml");
        response.setHeader("Content-disposition", disposition);
        try {
            template.process(licence, response.getWriter());
        } catch (TemplateException e) {
            e.printStackTrace();
        }
    }
}
