// ==UserScript==
// @name         KakaoStory Enhanced
// @namespace    http://chihaya.kr
// @version      1.0
// @description  Add-on for KakaoStory
// @author       Reflection, 박종우
// @match        https://story.kakao.com/*
// @icon         https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/story_favicon.ico
// @downloadURL  https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/enhanced.user.js
// @updateURL    https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/enhanced.user.js
// @require      https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @grant        GM_addStyle
// @grant        GM_notification
// ==/UserScript==

/*
 * Settings Parameters
 * enhancedSystemTheme : OS에 적용된 시스템 테마 사용 여부
 * enhancedSelectTheme : 선택한 테마(Light, Dark)
 * enhancedDarkThemeStyle : 다크 테마의 스타일(Discord, Dark Blue, Dark Red)
 * enhancedDiscordMention : 디스코드 멘션 스타일의 언급 UI 사용 여부
 * enhancedFontName : 설정된 폰트명
 * enhancedFontCSS : 설정된 폰트 CSS URL
 * enhancedFontSize : 설정된 폰트 크기
 * enhancedNotify : 알림 사용 여부
 * enhancedNotifySound : 알림 사운드 켜기 / 끄기
 * enhancedNotifyTime : 알림 시간
 * enhancedDownloadVideo : 동영상 다운로드 여부
 * enhancedHideChannelButton : 텔러/채널 버튼 숨기기
 * enhancedHideMemorize : 흑역사 숨기기
 * enhancedEmoticonSize : 이모티콘 크기
 * enhancedBlockUser : 강화된 차단 사용
 * enhancedVersion : 버전 정보
 * enhancedBlockStringList : 차단 문자열 리스트
 */

//let resourceURL = 'https://127.0.0.1:9000/kakaostory-enhanced/';
let resourceURL = 'https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/';
let myID = ''; //for discord mention style feature
let latestNotyID = ''; //for notification feature
let notyTimeCount = 0; //for notification feature
let blockedList = new Set(); //block users
let blockedStringList = new Array(); //block strings

function AddEnhancedMenu() {
    document.getElementsByClassName("menu_util")[0].innerHTML = '<li><a href="#" id="enhancedOpenSettings" class="link_menu _btnSettingProfile">Enhanced 설정</a></li>' + document.getElementsByClassName("menu_util")[0].innerHTML;
    $('body').on('click', '#enhancedOpenSettings', function() {
        document.getElementById("enhancedLayer").style.display = 'block';
        $('html,body').scrollTop(0);
        DisableScroll();
    });
}

function EnableScroll() {
    window.onscroll = function() {};
}

function DisableScroll() {
    window.onscroll = function() {
        window.scrollTo(0, 0);
    };
}

function GetMyID() {
    var tmpMyID = $('a[data-kant-id="737"]').attr('href').substring(1);
    if (tmpMyID.charAt(0) == '_') {
        myID = tmpMyID;
    } else {
        GetMySID(tmpMyID);
    }
}

function GetMySID(val) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonProf = JSON.parse(xmlHttp.responseText);
            if (jsonProf.activities.length == 0) {
                myID = '';
            } else {
                var tmpID = jsonProf.activities[0].id;
                myID = tmpID.split(".")[0];
            }
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/profiles/" + val + "?with=activities");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function HighlightCommentLikeDiscord() {
    var comments = document.getElementsByClassName("_commentContent");
    for (var i = 0; i < comments.length; i++) {
        var tmpComment = comments[i].getElementsByClassName("txt")[0].getElementsByClassName("_decoratedProfile");
        for ( var j = 0; j < tmpComment.length; j++) {
            var tmpUserID = tmpComment[j].getAttribute("data-id");
            if (myID == tmpUserID) {
                tmpComment[j].style.cssText = "background-color:rgba(0,0,0,0) !important;";
                comments[i].parentElement.style.cssText = 'background-color: rgba(250,166,26,0.1); border-left: 5px solid #f6a820; padding-left: 4px;';
            }
        }
    }
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
    var selectedTheme = GetValue('enhancedSelectTheme', 'dark');
    $('input:radio[name="enhancedSelectTheme"]:input[value=' + selectedTheme + ']').attr("checked", true);
    ChangeTheme(selectedTheme);

    var selectedDarkStyle = GetValue('enhancedDarkThemeStyle', 'discord');
    $('input:radio[name="enhancedSelectDarkStyle"]:input[value=' + selectedDarkStyle + ']').attr("checked", true);
    SetDarkThemeStyle(selectedDarkStyle);

    var useDiscordMention = GetValue('enhancedDiscordMention', 'false');
    $('input:radio[name="enhancedSelectDiscordMention"]:input[value=' + useDiscordMention + ']').attr("checked", true);

    if (GetValue('enhancedSystemTheme', 'true') == 'true'){
        document.getElementById('enhancedSystemTheme').checked = true;
    }
    else
    {
        document.getElementById('enhancedSystemTheme').checked = false;
    }

    var fontName = GetValue('enhancedFontName', 'Noto Sans KR');
    document.getElementById("enhancedTxtFontName").value = fontName;
    document.getElementById("enhancedTxtFontCSS").value = GetValue('enhancedFontCSS', 'https://fonts.googleapis.com/earlyaccess/notosanskr.css');
    SetFont();

    if (fontName == 'Noto Sans KR')
    {
        document.getElementById("enhancedFontNoto").checked = true;
    }
    else if (fontName == '나눔고딕')
    {
        document.getElementById("enhancedFontNanum").checked = true;
    }
    else
    {
        document.getElementById("enhancedFontCustom").checked = true;
    }

    document.getElementById('enhancedTxtFontSize').value = GetValue('enhancedFontSize', '0');
    SetFontSize();

    var notifyEnabled = GetValue('enhancedNotify', 'true');
    $('input:radio[name="enhancedSelectNotifyUse"]:input[value=' + notifyEnabled + ']').attr("checked", true);

    var notifySoundEnabled = GetValue('enhancedNotifySound', 'true');
    $('input:radio[name="enhancedSelectNotifySoundUse"]:input[value=' + notifySoundEnabled + ']').attr("checked", true);

    document.getElementById('enhancedTxtNotifyTime').value = GetValue('enhancedNotifyTime', '20');

    var downloadVideoEnabled = GetValue('enhancedDownloadVideo', 'false');
    $('input:radio[name="enhancedSelectDownloadVideo"]:input[value=' + downloadVideoEnabled + ']').attr("checked", true);

    var isHidden = GetValue('enhancedHideChannelButton', 'true');
    $('input:radio[name="enhancedSelectHideChannelButton"]:input[value=' + isHidden + ']').attr("checked", true);

    var isHiddenMemorize = GetValue('enhancedHideMemorize', 'true');
    $('input:radio[name="enhnacnedSelectHideMemorize"]:input[value=' + isHiddenMemorize + ']').attr("checked", true);

    var size = GetValue('enhancedEmoticonSize', 'small');
    $('input:radio[name="enhancedSelectEmoticonSize"]:input[value=' + size + ']').attr("checked", true);
    SetEmoticonSize();

    var isEnhancedBlock = GetValue('enhancedBlockUser', 'true');
    $('input:radio[name="enhancedSelectBlockUser"]:input[value=' + isEnhancedBlock + ']').attr("checked", true);

    var version = GM_info.script.version;
    if (version != GetValue('enhancedVersion', ''))
    {
        ViewUpdatePage();
        SetValue('enhancedVersion', version);
    }
    document.getElementById('enhancedCurrentVersion').innerText = "현재버전: " + version;

    GetCSSVersion();
    GetLatestVersion();

    CreateBlockStringList();
}

function CloseSettingsPage()
{
    document.getElementById("enhancedLayer").style.display = 'none';
    EnableScroll();
}

function GetCSSVersion() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var cssVersion = xmlHttp.responseText;
            document.getElementById('enhancedCSSVersion').innerText = cssVersion;
        }
    }
    xmlHttp.open("GET", resourceURL + "versions/css_version.txt");
    xmlHttp.send();
}

function GetLatestVersion() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var scriptData = xmlHttp.responseText;
            var latestVersion = scriptData.split("// @version      ")[1].split("\n")[0];
            document.getElementById('enhancedLatestVersion').innerText = "최신버전: " + latestVersion;
        }
    }
    xmlHttp.open("GET", resourceURL + "enhanced.user.js");
    xmlHttp.send();
}

function ViewUpdatePage() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var updatehtml = xmlHttp.responseText;
            var updateNotice = document.createElement('div');
            updateNotice.id = 'updateNoticeLayer';
            updateNotice.className = 'cover _cover';
            updateNotice.style.cssText = 'overflow-y: scroll;';
            document.body.appendChild(updateNotice);
            document.getElementById('updateNoticeLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="write cover_content cover_center" data-kant-group="wrt" data-part-name="view"><div class="_layerWrapper layer_write"><div class="section _dropZone account_modify"><div class="writing"><div class="inp_contents" data-part-name="editor"><strong class="subtit_modify subtit_enhanced">\' Enhanced 업데이트 내역</strong><div style="word-break: break-all">' + updatehtml + '</div></div></div><div></div><div class="inp_footer"><div class="bn_group"> <a href="#" class="_postBtn btn_com btn_or" id="enhancedUpdateNoticeOK"><em>알겠어용</em></a></div></div></div></div><div></div></div></div>';
            DisableScroll();
        }
    }
    xmlHttp.open("GET", resourceURL + "update_notice/update_notice.html");
    xmlHttp.send();
}

function ViewUpdateAllPage() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var updatehtml = xmlHttp.responseText;
            var updateNotice = document.createElement('div');
            updateNotice.id = 'updateNoticeLayer';
            updateNotice.className = 'cover _cover';
            updateNotice.style.cssText = 'overflow-y: scroll;';
            document.body.appendChild(updateNotice);
            document.getElementById('updateNoticeLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="write cover_content cover_center" data-kant-group="wrt" data-part-name="view"><div class="_layerWrapper layer_write"><div class="section _dropZone account_modify"><div class="writing"><div class="inp_contents" data-part-name="editor"><strong class="subtit_modify subtit_enhanced">\' Enhanced 업데이트 내역</strong><div style="word-break: break-all">' + updatehtml + '</div></div></div><div></div><div class="inp_footer"><div class="bn_group"> <a href="#" class="_postBtn btn_com btn_or" id="enhancedAllUpdateNoticeOK"><em>알겠어용</em></a></div></div></div></div><div></div></div></div>';
        }
    }
    xmlHttp.open("GET", resourceURL + "update_notice/update_notice_all.html");
    xmlHttp.send();
}

function LoadCommonEvents()
{
    //Add user to block list when block.
    $(document).on('click', 'a[data-kant-id="1391"]', function(){
        $(document).on('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]', function(){
            var splittedURL = $(location).attr('href').split('/');
            var bannedUserID = splittedURL[splittedURL.length - 1];
            blockedList.add(bannedUserID);
            $(document).off('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]');
        });
    });
    //Delete user to block list when unblock.
    $(document).on('click', 'a[data-kant-id="1392"]', function(){
        var splittedURL = $(location).attr('href').split('/');
        var bannedUserID = splittedURL[splittedURL.length - 1];
        blockedList.delete(bannedUserID);
        $(document).off('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]');
    });
    //Delete user to block list when unblock in settings page.
    $(document).on('click', 'a[data-kant-id="845"]', function() {
        var userIdx = $('a[data-kant-id="845"]').index(this);
        var userID = $('a[data-kant-id="844"]').eq(userIdx).parent().attr('data-model');
        blockedList.delete(userID);
    });

    $('body').on('click', '#enhancedBtnCancelBlockString', function() {
        document.getElementById("banStringLayer").remove();
    });

    $('body').on('click', '#enhancedBtnSaveBlockString', function() {
        var banStrings = document.getElementById("textBlockString").value;
        SetValue('enhancedBlockStringList', banStrings);
        CreateBlockStringList();
        document.getElementById("banStringLayer").remove();
    });
}

function LoadSettingsPageEvents()
{
    $(document).on('click', '#enhancedBtnOK', function() {
        SetValue('enhancedFontName', document.getElementById("enhancedTxtFontName").value);
        SetValue('enhancedFontCSS', document.getElementById("enhancedTxtFontCSS").value);
        SetFont();
        SetValue('enhancedFontSize', document.getElementById('enhancedTxtFontSize').value);
        SetFontSize();
        SetValue('enhancedNotifyTime', document.getElementById('enhancedTxtNotifyTime').value);
        CloseSettingsPage();
    });

    $(document).on("change",'input[name="enhancedSelectTheme"]',function(){
        if (GetValue('enhancedSystemTheme', 'true') == 'false') {
            var theme = $('[name="enhancedSelectTheme"]:checked').val();
            SetValue("enhancedSelectTheme", theme);
            ChangeTheme(theme);
        }
    });

    $(document).on("change",'input[name="enhancedSelectDarkStyle"]',function(){
        var styleName = $('[name="enhancedSelectDarkStyle"]:checked').val();
        SetValue("enhancedDarkThemeStyle", styleName);
        SetDarkThemeStyle(styleName);
    });

    $(document).on("change",'input[name="enhancedSelectDiscordMention"]',function(){
        var useMention = $('[name="enhancedSelectDiscordMention"]:checked').val();
        SetValue("enhancedDiscordMention", useMention);
        if (useMention == 'true')
        {
            GetMyID();
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

    $(document).on('click', '#enhancedFontNanum', function() {
        var fontName = "나눔고딕";
        var fontCSS = "";
        document.getElementById("enhancedTxtFontName").value = fontName;
        document.getElementById("enhancedTxtFontCSS").value = fontCSS;
        SetValue('enhancedFontName', fontName);
        SetValue('enhancedFontCSS', fontCSS);
    });

    $(document).on('click', '#enhancedFontNoto', function() {
        var fontName = "Noto Sans KR";
        var fontCSS = "https://fonts.googleapis.com/earlyaccess/notosanskr.css";
        document.getElementById("enhancedTxtFontName").value = fontName;
        document.getElementById("enhancedTxtFontCSS").value = fontCSS;
        SetValue('enhancedFontName', fontName);
        SetValue('enhancedFontCSS', fontCSS);
    });

    $(document).on('click', '.close_btn_cls', function() {
        CloseSettingsPage();
    });

    $(document).on('click', '#enhancedBtnBackupFriendsList', function() {
        BackupFriendsList();
    });

    $(document).on('click', '#enhancedBtnUpdateInfo', function() {
        ViewUpdateAllPage();
    });

    $(document).on("change",'input[name="enhancedSelectNotifyUse"]',function(){
        var changed = $('[name="enhancedSelectNotifyUse"]:checked').val();
        SetValue("enhancedNotify", changed);
    });

    $(document).on("change",'input[name="enhancedSelectNotifySoundUse"]',function(){
        var changed = $('[name="enhancedSelectNotifySoundUse"]:checked').val();
        SetValue("enhancedNotifySound", changed);
    });

    $(document).on("change",'input[name="enhancedSelectDownloadVideo"]',function(){
        var changed = $('[name="enhancedSelectDownloadVideo"]:checked').val();
        SetValue("enhancedDownloadVideo", changed);
    });

    $(document).on("change",'input[name="enhancedSelectHideChannelButton"]',function(){
        var changed = $('[name="enhancedSelectHideChannelButton"]:checked').val();
        SetValue("enhancedHideChannelButton", changed);
        HideChannelButton();
    });

    $(document).on("change",'input[name="enhnacnedSelectHideMemorize"]',function(){
        var changed = $('[name="enhnacnedSelectHideMemorize"]:checked').val();
        SetValue("enhancedHideMemorize", changed);
    });

    $(document).on("change",'input[name="enhancedSelectEmoticonSize"]',function(){
        var size = $('[name="enhancedSelectEmoticonSize"]:checked').val();
        SetValue("enhancedEmoticonSize", size);
        SetEmoticonSize();
    });

    $(document).on("change",'input[name="enhancedSelectBlockUser"]',function(){
        var isEnhancedBlock = $('[name="enhancedSelectBlockUser"]:checked').val();
        SetValue("enhancedBlockUser", isEnhancedBlock);
    });

    $('body').on('click', '#enhancedUpdateNoticeOK', function() {
        document.getElementById("updateNoticeLayer").remove();
        EnableScroll();
    });

    $('body').on('click', '#enhancedAllUpdateNoticeOK', function() {
        document.getElementById("updateNoticeLayer").remove();
    });

    $('body').on('click', '#enhancedBtnBlockString', function() {
        ShowBlockStringPage();
    });
}

function CreateBlockStringList() {
    var banStrings = GetValue('enhancedBlockStringList', '').split("\n");
    var blockedStringSet = new Set();
    for (var i = 0; i < banStrings.length; i++) {
        if (banStrings[i] == "") {
            continue;
        } else {
            blockedStringSet.add(banStrings[i]);
       }
    }

    blockedStringList = Array.from(blockedStringSet);
}

function SetFont()
{
    GM_addStyle("body, button, input, select, td, textarea, th {font-family: '" + GetValue('enhancedFontName', 'Noto Sans KR') + "' !important;}");
    GM_addStyle("@import url(" + GetValue('enhancedFontCSS', 'https://fonts.googleapis.com/earlyaccess/notosanskr.css') + ");");
}

function SetFontSize() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var lines = xmlHttp.responseText.split("\n");
            for (var i = 0; i < lines.length; i++) {

                var originSize = parseInt(lines[i].split("font-size: ")[1].split("px")[0]);
                var changedSize = originSize + parseInt(GetValue('enhancedFontSize', '0'));
                var modifiedCSS = lines[i].replace( originSize , changedSize);
                GM_addStyle ( modifiedCSS );
            }
        }
    }
    xmlHttp.open("GET", resourceURL + "css/font_size.css");
    xmlHttp.send();
}

function GetOSTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    } else {
        return 'light';
    }
}

function SetDarkThemeStyle(styleName) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var lines = xmlHttp.responseText.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var variableName = lines[i].split(":")[0];
                var variableValue = lines[i].split(": ")[1].split(";")[0];
                document.documentElement.style.setProperty(variableName, variableValue);
            }
        }
    }
    xmlHttp.open("GET", resourceURL + "theme_colors/" + styleName + ".css");
    xmlHttp.send();
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
        SetFont();
        SetFontSize();
        //SettingsV2 //Reload font css changed
        GM_addStyle('.head_story .tit_kakaostory .link_kakaostory { background: url(\''+ resourceURL + 'images/logo_kseh.png\'); } ');
    }
    //hide original logo
    GM_addStyle('.head_story .tit_kakaostory .logo_kakaostory { width: 0px !important; }');
    GM_addStyle('.head_story .tit_kakaostory .link_kakaostory { width: 144px !important; }');
    LoadEnhancedCSS();
}

function GetLatestNotify() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonNoty = JSON.parse(xmlHttp.responseText);
            var notyID = jsonNoty[0]["id"];
            var notyMessage = jsonNoty[0]["message"];
            var notyScheme = jsonNoty[0]["scheme"];
            var notyContent = jsonNoty[0]["content"];
            var notyURL = String(notyScheme).split("/");
            notyURL = notyURL[notyURL.length-1].replace(".", "/");
            if (String(notyID) != latestNotyID)
            {
                latestNotyID = String(notyID);
                if (String(jsonNoty[0]["is_new"]) == 'false') {
                    return;
                }
                if (notyContent == undefined) {
                    notyContent = ' ';
                }
                SetNotify(String(notyContent), String(notyMessage), String(notyURL));
            }
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/notifications");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function SetNotify(content, title_, url) {
    GM_notification ({
        text: content,
        title: title_,
        image: 'https://i.imgur.com/FSvg18g.png',
        highlight: false,
        silent: (GetValue('enhancedNotifySound', 'true') === 'true'),
        timeout: 5000,
        onclick: function () {
            space.Router.navigate("/" + url);
        }
    });
}

function SaveText(str, fileName) {
    var blob = new Blob([str], { type: "text/plain;charset=utf-8" });
    saveAs(blob, fileName);
}

function BackupFriendsList() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonFriends = JSON.parse(xmlHttp.responseText);
            var friendsText = '';
            for (var i = 0; i < jsonFriends.profiles.length; i ++) {
                friendsText = friendsText + String(jsonFriends.profiles[i]["display_name"]) + " : " + String(jsonFriends.profiles[i]["id"]) + '\n';
            }
            SaveText(friendsText, "친구목록백업.txt");
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/friends");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function AddDownloadVideoButton() {
    var videoControl = document.getElementsByClassName("mejs-controls");
    for (var i = 0; i < videoControl.length; i++) {
        var checkDownExists = videoControl[i].getElementsByClassName("mejs-button mejs-videodown-button");
        if (checkDownExists.length == 0) {
            var videoURL = videoControl[i].parentElement.getElementsByClassName("mejs-mediaelement")[0].getElementsByClassName("mejs-kakao")[0].getAttribute("src");
            var downloadBtnEl = document.createElement('div');
            downloadBtnEl.id = 'videodown';
            downloadBtnEl.className = 'mejs-button mejs-videodown-button';
            videoControl[i].appendChild(downloadBtnEl);
            videoControl[i].getElementsByClassName("mejs-button mejs-videodown-button")[0].innerHTML = '<button type="button" aria-controls="mep_2" title="Download" onclick="window.open(\'' + videoURL + '\')" aria-label="Download"></button>';
        }
    }
}

function HideChannelButton() {
    var isHidden = GetValue("enhancedHideChannelButton", "true");
    var val = isHidden == "true" ? 'none' : 'block';
    document.getElementsByClassName("storyteller_gnb")[0].style.display = val;
    document.getElementsByClassName("group_gnb")[0].style.display = val;
}

function HideMemorize() {
    var memorize = document.getElementsByClassName("section section_time");
    for (var i = 0; i < memorize.length; i++) {
        memorize[i].parentElement.style.display = 'none';
    }
}

function SetEmoticonSize()
{
    var sSize = GetValue("enhancedEmoticonSize", '');
    if (sSize == "small")
    {
        GM_addStyle('.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 64px !important; height: 64px !important; }');
        GM_addStyle('.fd_cont .txt_wrap .kakao_emoticon { width: 84px !important; height: 84px !important; }');
    } else if (sSize == "middle")
    {
        GM_addStyle('.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 96px !important; height: 96px !important; }');
        GM_addStyle('.fd_cont .txt_wrap .kakao_emoticon { width: 96px !important; height: 96px !important; }');
    } else
    {
        GM_addStyle('.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 128px !important; height: 128px !important; }');
        GM_addStyle('.fd_cont .txt_wrap .kakao_emoticon { width: 128px !important; height: 128px !important; }');
    }
}

function HideBlockedUserComment() {
    var comments = document.getElementsByClassName("_commentContent");
    for (var i = 0; i < comments.length; i++) {
        var bannedID = comments[i].getElementsByClassName("txt")[0].getElementsByTagName("p")[0].getElementsByTagName("a")[0].getAttribute("href").replace("/", "");

        if (blockedList.has(bannedID) == true) {
            comments[i].parentElement.style.display = 'none';
            /*
            comments[i].parentElement.remove();
            i -= 1; // only for remove()
            */
        }
    }
}

function GetBlockedUsers() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            var jsonBlocked = JSON.parse(xmlHttp.responseText);
            for (var i = 0; i < jsonBlocked.length; i ++) {
                blockedList.add(String(jsonBlocked[i]["id"]));
            }
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/bans");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function ShowBlockStringPage() {
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "banStringLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('banStringLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="dim_ly cover_content cover_center" data-kant-group="msg.w"><div class="ly_con message" style="top:84px"><div class="_container box_writing"><fieldset><legend class="tit_message">문자열 차단</legend><div class="box_from _receiverWrap" data-model="c56736" data-part-name="receiver"><div class="_suggestionWrap friends_search" style="display: block;"><label class="_suggestionInputPlaceholder lab_from" for="messageReceiver">차단할 문자열을 한줄에 하나씩 입력하세요.</label></div></div><div class="box_write color_11" data-model="c56736" data-part-name="writing"><div class="editable"><span class="write_edit" style="top: 162px;"><textarea class="tf_write _texxtarea" id="textBlockString" style="font-size: 22px; line-height: 26px; height: 370px;"></textarea></span> <span class="edit_gap"></span></div></div><div class="box_media menu_on"><div class="bn_group"><a href="#" class="btn_com _sendMessage btn_or" id="enhancedBtnSaveBlockString" data-kant-id="574"><em>저장</em></a></div></div><a href="#" class="link_close _hideWritingView" id="enhancedBtnCancelBlockString"><span class="ico_ks ico_close">취소</span></a></fieldset></div></div></div></div>';
    document.getElementById("textBlockString").value = GetValue('enhancedBlockStringList', '');
}

function HideBlockStringArticle() {
    var articles = document.getElementsByClassName("txt_wrap");
    for (var i = 0; i < articles.length; i++) {
        var articleText = articles[i].innerText.toLowerCase();
        for (var j = 0; j < blockedStringList.length; j++) {
            if (articleText.includes(blockedStringList[j].toLowerCase())) {
                if (articles[i].parentElement.className.toString().includes("share_wrap")) {
                    articles[i].parentElement.parentElement.parentElement.parentElement.parentElement.style.display = 'none';
                } else {
                    articles[i].parentElement.parentElement.parentElement.style.display = 'none';
                }
                continue;
            }
            //i -= 1; <-- only for remove()
        }
    }
}

function GetValue(key, defaultValue) {
    var value = localStorage[key];
    if (value == "" || value == null) {
        SetValue(key, defaultValue);
        value = defaultValue;
    }
    return value;
}

function SetValue(key, value)
{
    return localStorage[key]=value;
}

(function() {
    InitEnhancedSettingsPage();
    LoadCommonEvents();
    GetBlockedUsers();
    setTimeout(() => AddEnhancedMenu(), 1000);
    setTimeout(() => GetMyID(), 3000); //for discord style mention feature
    setTimeout(() => HideChannelButton(), 500); //hide channel and teller buttons

    setInterval(function() {
        if (GetValue('enhancedNotify', 'true') == 'true')
        {
            notyTimeCount += 1;
            if (notyTimeCount >= parseInt(GetValue('enhancedNotifyTime', '20')) * 10)
            {
                notyTimeCount = 0;
                GetLatestNotify();
            }
        }
        if (GetValue("enhancedDiscordMention", 'false') == 'true')
        {
            HighlightCommentLikeDiscord();
        }

        if (GetValue('enhancedDownloadVideo', 'false') == 'true') {
            AddDownloadVideoButton();
        }

        if (GetValue('enhancedHideMemorize', 'true') == 'true') {
            HideMemorize();
        }

        if (GetValue('enhancedBlockUser', 'true') == 'true')
        {
            HideBlockedUserComment();
        }

        HideBlockStringArticle();

    }, 100);
})();