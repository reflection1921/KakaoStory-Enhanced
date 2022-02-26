// ==UserScript==
// @name         KakaoStory Enhanced
// @namespace    http://chihaya.kr
// @version      0.37
// @description  Add-on for KakaoStory
// @author       Reflection, 박종우
// @match        https://story.kakao.com/*
// @downloadURL  https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/master/enhanced.user.js
// @updateURL    https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/master/enhanced.user.js
// @require      https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

/*
 * Settings Parameters
 * enhancedSystemTheme : OS에 적용된 시스템 테마 사용 여부
 * enhancedSelectTheme : 선택한 테마(Light, Dark)
 */
let resourceURL = 'https://127.0.0.1:9000/kakaostory-enhanced/';
//let resourceURL = 'https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/';

function addEnhancedMenu() {
    document.getElementsByClassName("menu_util")[0].innerHTML = '<li><a href="#" id="ksdarkEnhancedOpen" class="link_menu _btnSettingProfile">Enhanced 설정</a></li>' + document.getElementsByClassName("menu_util")[0].innerHTML;
    $('body').on('click', '#ksdarkEnhancedOpen', function() {
        document.getElementById("enhancedLayer").style.display = 'block';
        $('html,body').scrollTop(0);
        //disableScroll();
    });
}

// Settings Page
function InitEnhancedSettingsPage() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var html = xmlHttp.responseText;

            AttachEnhancedSettingsPage(html);
            InitEnhancedValues();
            LoadSettingsPageEvents();
        }
    }
    xmlHttp.open("GET", resourceURL + "enhanced_settings.html");
    xmlHttp.send();
}

function AttachEnhancedSettingsPage(html)
{
    var settings = document.createElement('div');
    settings.id = 'enhancedLayer';
    settings.className = 'cover _cover';
    settings.style.cssText = 'display: none;  overflow-y: scroll;';
    document.body.appendChild(settings);
    document.getElementById('enhancedLayer').innerHTML = html;
}

function InitEnhancedValues()
{
    if (GetValue('enhancedSelectTheme', 'dark') == 'light')
    {
        document.getElementById('enhancedThemeLight').checked = true;
        ChangeTheme("light");
    }
    else
    {
        document.getElementById('enhancedThemeDark').checked = true;
        ChangeTheme("dark");
    }

    if (GetValue('enhancedSystemTheme', 'true') == 'true') {
        document.getElementById('enhancedSystemTheme').checked = true;
    }
    else
    {
        document.getElementById('enhancedSystemTheme').checked = false;
    }
}

function LoadSettingsPageEvents()
{
    $(document).on("change",'input[name="enhancedSelectTheme"]',function(){
        if (GetValue('enhancedSystemTheme', 'true') == 'false') {
            var theme = $('[name="enhancedSelectTheme"]:checked').val();
            console.log(theme);
            SetValue("enhancedSelectTheme", theme);
            ChangeTheme(theme);
        }
    });

    $(document).on("change",'input[name="enhancedUseSystemTheme"]',function(){
        if (document.getElementById("enhancedSystemTheme").checked) {
            SetValue('enhancedSystemTheme', 'true');
            var systemTheme = GetOSTheme();
            var currentTheme = GetValue('enhancedSelectTheme', 'dark');
            if (systemTheme != currentTheme) {
                SetValue('enhancedSelectTheme', systemTheme);
                ChangeTheme(systemTheme);
            }
        } else {
            SetValue('enhancedSystemTheme', 'false');
        }
    });
}

function GetOSTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    } else {
        return 'light';
    }
}

function LoadDarkThemeCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var darkcss = xmlHttp.responseText;
            GM_addStyle ( darkcss );
        }
    }
    xmlHttp.open("GET", resourceURL + "css/darktheme.css");
    xmlHttp.send();
}

function LoadEnhancedCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var darkcss = xmlHttp.responseText;
            GM_addStyle ( darkcss );
        }
    }
    xmlHttp.open("GET", resourceURL + "css/enhanced.css");
    xmlHttp.send();
}

function ChangeTheme(styleName)
{
    if (styleName == 'dark')
    {
        LoadDarkThemeCSS();
    }
    else
    {
        $('style').remove(); //Remove Dark Theme CSS
        //Font Size, SettingsV2 //Reload font css changed
        GM_addStyle('.head_story .tit_kakaostory .link_kakaostory { background: url(\''+ resourceURL + 'logo_kseh.png\'); } ');
    }
    LoadEnhancedCSS();
}

function GetValue(key, defaultValue) {
    var value = localStorage[key] || defaultValue;
    if (value == "") {
        SetValue(key, defaultValue);
    }
    return value;
}

function SetValue(key, value)
{
    return localStorage[key]=value;
}

(function() {
    InitEnhancedSettingsPage();
    setTimeout(() => addEnhancedMenu(), 1000);
})();