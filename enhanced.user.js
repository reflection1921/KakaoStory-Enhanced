// ==UserScript==
// @name         KakaoStory Enhanced
// @namespace    http://chihaya.kr
// @version      1.31
// @description  Add-on for KakaoStory
// @author       Reflection, 박종우
// @match        https://story.kakao.com/*
// @match        https://accounts.kakao.com/*
// @icon         https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/story_favicon.ico
// @downloadURL  https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/enhanced.user.js
// @updateURL    https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/enhanced.user.js
// @require      https://cdn.jsdelivr.net/npm/chart.js
// ==/UserScript==


let scriptVersion = "1.31";

let resourceURL = 'http://127.0.0.1:8188/kakaostory-enhanced/'; //for debug
//let resourceURL = 'https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/dev/'; //github dev
//let resourceURL = 'https://raw.githubusercontent.com/reflection1921/KakaoStory-Enhanced/main/';
let myID = ''; //for discord mention style feature
//let latestNotyID = ''; //for notification feature
let notyTimeCount = 0; //for notification feature
let blockedList = new Set(); //block users
let blockedStringList = []; //block strings
let feedBlockedList = new Set(); //blocked feed users
let catEffect = new Audio(resourceURL + 'sounds/cat-meow.mp3');
let catEffect2 = new Audio(resourceURL + 'sounds/cat-meow-2.mp3');
let dogEffect = new Audio(resourceURL + 'sounds/dog-bark.mp3');
let jThemes;

let powerComboCnt = 0;
let powerComboTimeCnt = 0;

let deletedFriendCount = 0;
let jsonMyFriends;

let jsonPermActivities;
let changePermCount = 0;
let changeInternalPermCount = 0;
let changePermUserID;
let changePermActivityCount;
let currentFavicon = "naver";
let currentTitle = "NAVER";
//let selCurPerm = 'Z'; //A = 전체공개, F = 친구공개, M = 나만보기, Z = 기본설정(모든 게시글)
//let selNewPerm = 'F'; //A = 전체공개, F = 친구공개, M = 나만보기

let notyOption = {
    body: '',
    icon: 'https://i.imgur.com/FSvg18g.png',
    silent: false
}

//konami command to restore kakaostory favicon classic
let konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
let konamiCount = 0;

/* For Login Page */
let svgDark = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="feather feather-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
let svgLight = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="feather feather-sun"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';

function AddEnhancedMenu() {
    document.getElementsByClassName("menu_util")[0].innerHTML = '<li><a href="#" id="enhancedHideSidebar" class="link_menu _btnSettingProfile">사이드바 숨기기</a></li><li class="enhanced_settings_menu"><a href="#" id="enhancedOpenSettings" class="link_menu _btnSettingProfile">Enhanced 설정</a></li>' + document.getElementsByClassName("menu_util")[0].innerHTML;
    document.getElementById("enhancedOpenSettings").addEventListener("click", function() {
        document.getElementById("enhancedLayer").style.display = 'block';
        document.body.scrollTop = 0;
        DisableScroll();
    });
    document.getElementById("enhancedHideSidebar").addEventListener("click", function() {
        document.getElementById("mSnb").classList.add('enhanced_sidebar_hidden');
        document.getElementById("enhancedShowSidebar").style.display = 'block';
        SetValue('enhancedSidebarShow', 'false');
    });

    var showBtn = document.createElement('div');
    showBtn.id = 'enhancedShowSidebar';
    if (GetValue('enhancedSidebarLocation', 'right') == 'right')
    {
        showBtn.className = 'enhanced_sidebar_show';
        showBtn.innerHTML = '<span class="enhanced_sidebar_show_btn_to_left"></span>'
    }
    else
    {
        showBtn.className = 'enhanced_sidebar_show_left';
        showBtn.innerHTML = '<span class="enhanced_sidebar_show_btn_to_right"></span>'
    }
    

    document.getElementById("rnb").insertBefore(showBtn, document.getElementById("rnb").firstChild);
    document.getElementById("enhancedShowSidebar").addEventListener("click", function() {
        document.getElementById("mSnb").classList.remove('enhanced_sidebar_hidden');
        document.getElementById("enhancedShowSidebar").style.display = 'none';
        SetValue('enhancedSidebarShow', 'true');
    });

    if (GetValue('enhancedSidebarShow', 'true') == 'false')
    {
        document.getElementById("mSnb").classList.add('enhanced_sidebar_hidden');
        document.getElementById("enhancedShowSidebar").style.display = 'block';
    }
    else
    {
        document.getElementById("mSnb").classList.remove('enhanced_sidebar_hidden');
        document.getElementById("enhancedShowSidebar").style.display = 'none';
    }
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
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
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
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
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
    
    LoadThemeList();
    ChangeTheme(selectedTheme);

    var useDiscordMention = GetValue('enhancedDiscordMention', 'false');
    $('input:radio[name="enhancedSelectDiscordMention"]:input[value=' + useDiscordMention + ']').attr("checked", true);

    if (GetValue('enhancedSystemTheme', 'true') == 'true'){
        document.getElementById('enhancedSystemTheme').checked = true;
    }
    else
    {
        document.getElementById('enhancedSystemTheme').checked = false;
    }

    var fontName = GetValue('enhancedFontName', 'Pretendard');
    document.getElementById("enhancedTxtFontName").value = fontName;
    document.getElementById("enhancedTxtFontCSS").value = GetValue('enhancedFontCSS', 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css');
    SetFont();

    if (fontName == 'Pretendard')
    {
        document.getElementById("enhancedFontNoto").checked = true;
        document.getElementById("groupEnhancedFontCustomEnable").style.display = "none";
    }
    else if (fontName == '나눔고딕')
    {
        document.getElementById("enhancedFontNanum").checked = true;
        document.getElementById("groupEnhancedFontCustomEnable").style.display = "none";
    }
    else
    {
        document.getElementById("enhancedFontCustom").checked = true;
        document.getElementById("groupEnhancedFontCustomEnable").style.display = "block";
    }

    document.getElementById('enhancedTxtFontSize').value = GetValue('enhancedFontSize', '0');
    SetFontSize();

    var notifyEnabled = GetValue('enhancedNotify', 'false');
    $('input:radio[name="enhancedSelectNotifyUse"]:input[value=' + notifyEnabled + ']').attr("checked", true);
    document.getElementById("groupEnhancedNotifyEnable").style.display = (notifyEnabled == "true")? "block" : "none";

    var notifySoundEnabled = GetValue('enhancedNotifySound', 'true');
    notyOption.silent = (notifySoundEnabled == 'true')? false : true;
    $('input:radio[name="enhancedSelectNotifySoundUse"]:input[value=' + notifySoundEnabled + ']').attr("checked", true);

    document.getElementById('enhancedTxtNotifyTime').value = GetValue('enhancedNotifyTime', '20');

    var downloadVideoEnabled = GetValue('enhancedDownloadVideo', 'false');
    $('input:radio[name="enhancedSelectDownloadVideo"]:input[value=' + downloadVideoEnabled + ']').attr("checked", true);

    var isHidden = GetValue('enhancedHideChannelButton', 'true');
    $('input:radio[name="enhancedSelectHideChannelButton"]:input[value=' + isHidden + ']').attr("checked", true);

    var isHiddenLogo = GetValue('enhancedHideLogo', 'false');
    $('input:radio[name="enhancedSelectHideLogo"]:input[value=' + isHiddenLogo + ']').attr("checked", true);
    document.getElementById("groupEnhancedHideLogoEnable").style.display = (isHiddenLogo == "true")? "block" : "none";

    var isHiddenLogoNoti = GetValue('enhancedHideLogoNoti', 'false');
    $('input:radio[name="enhancedSelectHideLogoNoti"]:input[value=' + isHiddenLogoNoti + ']').attr("checked", true);

    var hiddenLogoIcon = GetValue('enhancedHideLogoIcon', 'naver');
    $('input:radio[name="enhancedSelectLogoIcon"]:input[value=' + hiddenLogoIcon + ']').attr("checked", true);
    document.getElementById("groupEnhancedHideLogoCustomEnable").style.display = (hiddenLogoIcon == "custom")? "block" : "none";
    currentFavicon = hiddenLogoIcon;
    currentTitle = GetHideLogoIconTitle();
    document.getElementById('enhancedTxtHideLogoTitle').value = GetValue('enhancedFaviconTitle', 'NAVER');
    document.getElementById('enhancedTxtHideLogoFaviconURL').value = GetValue('enhancedFaviconURL', resourceURL + 'images/naver.ico');

    var isHiddenMemorize = GetValue('enhancedHideMemorize', 'true');
    $('input:radio[name="enhnacnedSelectHideMemorize"]:input[value=' + isHiddenMemorize + ']').attr("checked", true);

    var isHiddenRecommendFriend = GetValue('enhancedHideRecommendFriend', 'false');
    $('input:radio[name="enhancedSelectRecommendFriend"]:input[value=' + isHiddenRecommendFriend + ']').attr("checked", true);
    HideRecommendFriend();

    var size = GetValue('enhancedEmoticonSize', 'small');
    $('input:radio[name="enhancedSelectEmoticonSize"]:input[value=' + size + ']').attr("checked", true);
    SetEmoticonSize();

    var isEnhancedBlock = GetValue('enhancedBlockUser', 'true');
    $('input:radio[name="enhancedSelectBlockUser"]:input[value=' + isEnhancedBlock + ']').attr("checked", true);
    document.getElementById("groupEnhancedBlockUser").style.display = (isEnhancedBlock == "true")? "block" : "none";

    var isEnhancedFeedBlock = GetValue('enhancedExtendFeedBlock', 'false');
    $('input:radio[name="enhancedSelectFeedBlockUser"]:input[value=' + isEnhancedFeedBlock + ']').attr("checked", true);

    var isKitty = GetValue('enhancedKittyMode', 'none');
    $('input:radio[name="enhancedSelectKittyMode"]:input[value=' + isKitty + ']').attr("checked", true);

    var isPuppy = GetValue('enhancedPuppyMode', 'none');
    $('input:radio[name="enhancedSelectPuppyMode"]:input[value=' + isPuppy + ']').attr("checked", true);

    var isEarthquake = GetValue('enhancedEarthquake', 'false');
    $('input:radio[name="enhancedSelectEarthquake"]:input[value=' + isEarthquake + ']').attr("checked", true);

    var isBlink = GetValue('enhancedBlink', 'false');
    $('input:radio[name="enhancedSelectBlink"]:input[value=' + isBlink + ']').attr("checked", true);

    var isKeyboard = GetValue('enhancedKeyboard', 'false');
    $('input:radio[name="enhancedSelectKeyboard"]:input[value=' + isKeyboard + ']').attr("checked", true);

    var isBlockAllArticle = GetValue('enhancedBlockArticleAll', 'true');
    $('input:radio[name="enhancedSelectBlockArticleAll"]:input[value=' + isBlockAllArticle + ']').attr("checked", true);

    var useWideMode = GetValue('enhancedWideMode', 'false');
    if (useWideMode == 'true')
    {
        SetValue('enhancedWideMode', 'fixed');
        useWideMode = 'fixed';
    }
    $('input:radio[name="enhancedSelectWideMode"]:input[value=' + useWideMode + ']').attr("checked", true);

    var sidebarLocation = GetValue('enhancedSidebarLocation', 'right');
    $('input:radio[name="enhancedSelectSidebarLocation"]:input[value=' + sidebarLocation + ']').attr("checked", true);

    document.getElementById('enhancedCurrentVersion').innerText = "현재버전: " + scriptVersion;

    document.getElementById('enhancedTxtThemeSaturation').value = GetValue('enhancedThemeSaturation', '1');
    document.getElementById('inputSlideThemeSaturation').value = GetValue('enhancedThemeSaturation', '1');

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
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
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
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var scriptData = xmlHttp.responseText;
            var latestVersion = scriptData.split("// @version      ")[1].split("\n")[0];
            document.getElementById('enhancedLatestVersion').innerText = "최신버전: " + latestVersion;
            //Update
            var majorLatestVersion = latestVersion.split(".")[0];
            majorLatestVersion = Number(majorLatestVersion);
            var minorLatestVersion = latestVersion.split(".")[1];
            minorLatestVersion = Number(minorLatestVersion);

            var majorScriptVersion = scriptVersion.split(".")[0];
            majorScriptVersion = Number(majorScriptVersion);

            var minorScriptVersion = scriptVersion.split(".")[1];
            minorScriptVersion = Number(minorScriptVersion);

            if (majorLatestVersion > majorScriptVersion || (majorLatestVersion == majorScriptVersion && minorLatestVersion > minorScriptVersion))
            {
                ViewUpdatePage();
            }
        }
    }
    xmlHttp.open("GET", resourceURL + "enhanced.user.js");
    xmlHttp.send();
}

function ViewUpdatePage() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            let updateHtml = xmlHttp.responseText;
            let updateNotice = document.createElement('div');
            updateNotice.id = 'updateNoticeLayer';
            updateNotice.className = 'cover _cover';
            updateNotice.style.cssText = 'overflow-y: scroll;';
            document.body.appendChild(updateNotice);
            document.getElementById('updateNoticeLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="write cover_content cover_center" data-kant-group="wrt" data-part-name="view"><div class="_layerWrapper enhanced_layer_settings"><div class="section _dropZone account_modify"><div class="writing"><div class="inp_contents" data-part-name="editor"><strong class="subtit_modify subtit_enhanced">\' Enhanced 업데이트 내역</strong><div style="word-break: break-all">' + updateHtml + '</div></div></div><div></div><div class="inp_footer"><div class="bn_group"> <a href="https://github.com/reflection1921/KakaoStory-Enhanced/raw/main/enhanced.user.js" class="_postBtn btn_com btn_or" id="enhancedUpdateNoticeOK"><em>업데이트</em></a></div></div></div></div><div></div></div></div>';
            DisableScroll();
        }
    }
    xmlHttp.open("GET", resourceURL + "update_notice/update_notice.html");
    xmlHttp.send();
}

function ViewUpdateAllPage() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            let updateHtml = xmlHttp.responseText;
            let updateNotice = document.createElement('div');
            updateNotice.id = 'updateNoticeLayer';
            updateNotice.className = 'cover _cover';
            updateNotice.style.cssText = 'overflow-y: scroll;';
            document.body.appendChild(updateNotice);
            document.getElementById('updateNoticeLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="write cover_content cover_center" data-kant-group="wrt" data-part-name="view"><div class="_layerWrapper enhanced_layer_settings"><div class="section _dropZone account_modify"><div class="writing"><div class="inp_contents" data-part-name="editor"><strong class="subtit_modify subtit_enhanced">\' Enhanced 업데이트 내역</strong><div style="word-break: break-all">' + updateHtml + '</div></div></div><div></div><div class="inp_footer"><div class="bn_group"> <a href="#" class="_postBtn btn_com btn_or" id="enhancedAllUpdateNoticeOK"><em>알겠어용</em></a></div></div></div></div><div></div></div></div>';
        }
    }
    xmlHttp.open("GET", resourceURL + "update_notice/update_notice_all.html");
    xmlHttp.send();
}

function ViewDetailNotFriendArticle()
{
    var detail = document.getElementsByClassName("_btnViewDetailInShare");
    for (let i = 0; i < detail.length; i++)
    {
        if (detail[i].innerText === "...더보기")
        {
            detail[i].href = "javascript:void(0);";
            detail[i].className = "_btnViewDetailNotFriend";
        }
    }
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
    //Add user to feed list when disable feed.
    $(document).on('click', 'a[data-kant-id="853"]', function(){
        $(document).on('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]', function(){
            var splittedURL = $(location).attr('href').split('/');
            var bannedUserID = splittedURL[splittedURL.length - 1];
            blockedList.add(bannedUserID);
            $(document).off('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]');
        });
    });
    //Delete user to feed list when re-enable feed.
    $(document).on('click', 'a[data-kant-id="852"]', function(){
        $(document).on('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]', function(){
            var splittedURL = $(location).attr('href').split('/');
            var bannedUserID = splittedURL[splittedURL.length - 1];
            blockedList.delete(bannedUserID);
            $(document).off('click', 'a[class="btn_com btn_or _dialogOk _dialogBtn"]');
        });
    });
    //Delete user to feed list when re-enable feed.
    $(document).on('click', 'a[data-kant-id="857"]', function(){
        var splittedURL = $(location).attr('href').split('/');
        var bannedUserID = splittedURL[splittedURL.length - 1];
        blockedList.delete(bannedUserID);
    });
    //Delete user to block list when unblock in settings page.
    $(document).on('click', 'a[data-kant-id="845"]', function() {
        var userIdx = $('a[data-kant-id="845"]').index(this);
        var userID = $('a[data-kant-id="844"]').eq(userIdx).parent().attr('data-model');
        blockedList.delete(userID);
    });

    $('body').on('click', '#enhancedBtnSaveBlockString', function() {
        var blockStrings = document.getElementById("textBlockString").value;
        SetValue('enhancedBlockStringList', blockStrings);
        CreateBlockStringList();
        document.getElementById("banStringLayer").remove();
    });

    $('body').on('click', '#enhancedBtnCancelBlockString', function() {
        document.getElementById("banStringLayer").remove();
    });

    $('body').on('click', '#enhancedBtnCancelBlockString', function() {
        document.getElementById("banStringLayer").remove();
    });

    $('body').on('click', '._btnViewDetailNotFriend', function() {
        this.parentElement.parentElement.getElementsByClassName("txt_wrap")[0].getElementsByClassName("_content")[0].style.cssText = "overflow: hidden;";
        this.style.display = 'none';
    });

    $(document).on('keydown', '._editable', function(e) {
        if (GetValue("enhancedEarthquake", 'false') == 'true') {
            $('div[data-part-name="writing"]').addClass("shake_text");
            $('.layer_write').addClass("shake_text");
            VisibleEnhancedPowerModeCount();
        }
        if (GetValue("enhancedBlink", 'false') == 'true') {
            document.getElementById("contents_write").classList.add("blink_text");
        }
    });

    $(document).on('keydown', '[id^=comt_view]', function(e) {
        if (GetValue("enhancedEarthquake", 'false') == 'true') {
            if ($(e.target).parents('._commentWriting').length > 0) {
                $(e.target).parents('._commentWriting').addClass("shake_text");
                VisibleEnhancedPowerModeCount();
            }
        }

    });

    $(document).on('keyup', '._editable', function() {
        $('div[data-part-name="writing"]').removeClass("shake_text");
        $('.layer_write').removeClass("shake_text");
        document.getElementById("contents_write").classList.remove("blink_text");
    });

    $(document).on('keyup', '[id^=comt_view]', function() {
        $('._commentWriting').removeClass("shake_text");
    });

    document.addEventListener('keydown', function(e) {
        if (e.code === konami[konamiCount]) {
            konamiCount++;
            if (konamiCount >= 10) {
                konamiCount = 0;
                var faviconClassic = GetValue("enhancedFaviconClassic", "false") == "true";
                SetValue("enhancedFaviconClassic", (faviconClassic)? "false" : "true");
            }
        } else {
            konamiCount = 0;
        }

        if (GetValue("enhancedKeyboard", 'false') == 'false')
        {
            return;
        }

        //check element is input
        if (document.activeElement.tagName == "INPUT" || document.activeElement.tagName == "TEXTAREA") {
            return;
        }


        //check e's element id is contents_write
        if (e.target.id == "contents_write") {
            return;
        }

        //check e's element class has 'comt_view<random_number>'
        var elemId = e.target.id;
        if (elemId.includes("comt_view")) {
            return;
        }

        if (document.getElementById("enhancedLayer").style.display == 'block')
        {
            return;
        }

        /* KEYBOARD CONTROL */

        //Shift + M - Permission : Only Me
        if (e.shiftKey && e.code === 'KeyM')
        {
            var selElem = GetSelectedActivity();
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                selElem = document.getElementsByClassName("section _activity")[0];
            }
            else if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                selElem = document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center")[0];
            }
            var settingElem = selElem.getElementsByClassName("ico_ks bn_modify _btnSetting")[0];
            if (settingElem)
            {
                var p = selElem.querySelector('li[data-permission="M"]');
                if (!p)
                {
                    settingElem.click();
                }
                
                setTimeout(() => {
                    var permElem = selElem.querySelector('li[data-permission="M"]');
                    if (permElem)
                    {
                        permElem.click();
                    }
                }, 100);
            }

            return;
        }

        //Shift + F - Permission : Friends
        if (e.shiftKey && e.code === 'KeyF')
        {
            var selElem = GetSelectedActivity();
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                selElem = document.getElementsByClassName("section _activity")[0];
            }
            else if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                selElem = document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center")[0];
            }
            var settingElem = selElem.getElementsByClassName("ico_ks bn_modify _btnSetting")[0];
            if (settingElem)
            {
                var p = selElem.querySelector('li[data-permission="F"]');
                if (!p)
                {
                    settingElem.click();
                }

                setTimeout(() => {
                    var permElem = selElem.querySelector('li[data-permission="F"]');
                    if (permElem)
                    {
                        permElem.click();
                    }
                }, 100);
            }

            return;
        }

        //Shift + A - Permission : All
        if (e.shiftKey && e.code === 'KeyA')
        {
            var selElem = GetSelectedActivity();
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                selElem = document.getElementsByClassName("section _activity")[0];
            }
            else if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                selElem = document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center")[0];
            }
            var settingElem = selElem.getElementsByClassName("ico_ks bn_modify _btnSetting")[0];
            if (settingElem)
            {
                var p = selElem.querySelector('li[data-permission="A"]');
                if (!p)
                {
                    settingElem.click();
                }

                setTimeout(() => {
                    var permElem = selElem.querySelector('li[data-permission="A"]');
                    if (permElem)
                    {
                        permElem.click();
                    }
                }, 100);
            }

            return;
        }

        //J - FEED Down
        if (e.code === 'KeyJ')
        {
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                return;
            }

            if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                return;
            }

            var articles = document.getElementsByClassName("section _activity");
            var visibleArticles = Array.from(articles).filter(function(element) {
                return window.getComputedStyle(element).display !== "none";
              });

            for (var i = 0; i < visibleArticles.length; i++)
            {
                if (visibleArticles[i].classList.contains("enhanced_activty_selected"))
                {
                    if (i == visibleArticles.length - 1)
                    {
                        //visibleArticles[i].scrollIntoView();
                        ScrollToTargetSmoothly(visibleArticles[i]);
                        break;
                    }
                    visibleArticles[i].classList.remove("enhanced_activty_selected");
                    visibleArticles[i + 1].classList.add("enhanced_activty_selected");
                    //visibleArticles[i + 1].scrollIntoView();
                    ScrollToTargetSmoothly(articles[i + 1]);
                    break;
                }
                if (i == visibleArticles.length - 1)
                {
                    visibleArticles[0].classList.add("enhanced_activty_selected");
                    //visibleArticles[0].scrollIntoView();
                    ScrollToTargetSmoothly(visibleArticles[0]);
                }
            }
        }

        //K - Feed Up
        if (e.code === 'KeyK')
        {
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                return;
            }

            if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                return;
            }
            var articles = document.getElementsByClassName("section _activity");
            var visibleArticles = Array.from(articles).filter(function(element) {
                return window.getComputedStyle(element).display !== "none";
            });

            for (var i = 0; i < visibleArticles.length; i++)
            {
                if (visibleArticles[i].classList.contains("enhanced_activty_selected"))
                {
                    if (i == 0)
                    {
                        //visibleArticles[i].scrollIntoView();
                        ScrollToTargetSmoothly(visibleArticles[i])
                        break;
                    }
                    visibleArticles[i].classList.remove("enhanced_activty_selected");
                    visibleArticles[i - 1].classList.add("enhanced_activty_selected");
                    //visibleArticles[i - 1].scrollIntoView();
                    ScrollToTargetSmoothly(visibleArticles[i - 1]);
                    break;
                }
                if (i == visibleArticles.length - 1)
                {
                    visibleArticles[0].classList.add("enhanced_activty_selected");
                    //visibleArticles[0].scrollIntoView();
                    ScrollToTargetSmoothly(visibleArticles[0]);
                }
            }
        }

        //G(Double G) - Feed TOP / BOTTOM
        if (e.code === 'KeyG')
        {
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                return;
            }

            if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                return;
            }

            var currentTime = new Date().getTime();
            if (!gKeyPressed)
            {
                gKeyPressed = true;
                lastKeyPressTime = currentTime;

                // Normal G
                setTimeout(function() {
                    if (gKeyPressed && currentTime - lastKeyPressTime < doubleKeyPressThreshold) {
                        onGKeyPress(false);
                        gKeyPressed = false;
                    }
                }, doubleKeyPressThreshold);
            }
            else //Double G
            {
                onGKeyPress(true);
                gKeyPressed = false;
            }
        }

        //R - Refresh Feed / Go to Main
        if (e.code === 'KeyR')
        {
            var elem = document.getElementsByClassName("link_kakaostory _btnHome")[0];
            if (elem) {
                elem.click();
            }
        }

        //F - Article Detail View(Close : ESC)
        if (e.code === 'KeyF')
        {
            var selElem = GetSelectedActivity();
            var timeElem = selElem.getElementsByClassName("time _linkPost")[0];
            if (timeElem)
            {
                timeElem.click();
            }
        }

        //N - New Article
        if (e.code === 'KeyN')
        {
            var elem = document.getElementsByClassName("link_gnb link_write _toggleWriteButton")[0];
            if (elem) {
                elem.click();
                e.preventDefault();
            }
        }

        //I - Comment Write
        if (e.code === 'KeyI')
        {
            var selElem = GetSelectedActivity();
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                selElem = document.getElementsByClassName("section _activity")[0];
            }
            else if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                selElem = document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center")[0];
            }
            var comment_elem = selElem.getElementsByClassName("_commentWritingPlaceholder")[0];
            //var comment_elem = selElem.querySelectorAll('[id*="comt_view"]')[0];
            if (comment_elem)
            {
                ScrollToTargetSmoothly(comment_elem);
                comment_elem.click();
                e.preventDefault();
            }
        }

        //P - Previous Comment
        if (e.code === 'KeyP')
        {
            var selElem = GetSelectedActivity();
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                selElem = document.getElementsByClassName("section _activity")[0];
            }
            else if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                selElem = document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center")[0];
            }
            var prevElem = selElem.getElementsByClassName("_btnShowPrevComment")[0];
            if (prevElem)
                prevElem.click();
        }
        
        //C - First Comment
        if (e.code === 'KeyC')
        {
            var selElem = GetSelectedActivity();
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                selElem = document.getElementsByClassName("section _activity")[0];
            }
            else if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                selElem = document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center")[0];
            }
            var prevElem = selElem.getElementsByClassName("link_view _btnShowFirstComment")[0];
            if (prevElem)
                prevElem.click();
        }

        //L - Like Feeling Button
        if (e.code === 'KeyL')
        {
            var selElem = GetSelectedActivity();
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                selElem = document.getElementsByClassName("section _activity")[0];
            }
            else if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                selElem = document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center")[0];
            }
            var likeElem = selElem.getElementsByClassName("_btnLike")[0];
            if (likeElem)
            {
                likeElem.click();
            }       
        }
        
        //D - Delete My Selected Article
        if (e.code === 'KeyD')
        {
            var selElem = GetSelectedActivity();
            if (document.getElementsByClassName("feed detail_desc _feedContainer").length > 0)
            {
                selElem = document.getElementsByClassName("section _activity")[0];
            }
            else if (document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center").length > 0)
            {
                selElem = document.getElementsByClassName("wrap_map wrap_desc detail_desc cover_content cover_center")[0];
            }
            var settingElem = selElem.getElementsByClassName("ico_ks bn_modify _btnSetting")[0];
            if (settingElem)
            {
                var p = document.getElementsByClassName("_btnActivityDelete link_menu")[0];
                if (!p)
                {
                    settingElem.click();
                }
                setTimeout(() => {
                    var deleteElem = document.getElementsByClassName("_btnActivityDelete link_menu")[0];
                    if (deleteElem)
                    {
                        deleteElem.click();
                    }
                }, 100);
            }
        }

    });
}

function GetSelectedActivity()
{
    var articles = document.getElementsByClassName("section _activity");
    var visibleArticles = Array.from(articles).filter(function(element) {
        return window.getComputedStyle(element).display !== "none";
    });

    var selectedIdx = -1;
    
    for (var i = 0; i < visibleArticles.length; i++)
    {
        if (visibleArticles[i].classList.contains("enhanced_activty_selected"))
        {
            selectedIdx = i;
            break;
        }
    }

    if (selectedIdx === -1)
        return null;

    return visibleArticles[selectedIdx];
}

/* G KEY VARIABLES */
var gKeyPressed = false;
var lastKeyPressTime = 0;
var doubleKeyPressThreshold = 300;

function onGKeyPress(doublePress)
{
    var articles = document.getElementsByClassName("section _activity");
    var visibleArticles = Array.from(articles).filter(function(element) {
        return window.getComputedStyle(element).display !== "none";
    });

    for (var i = 0; i < visibleArticles.length; i++)
    {
        visibleArticles[i].classList.remove("enhanced_activty_selected");
    }

    if (doublePress)
    {
        ScrollToTargetSmoothly(visibleArticles[0]);
        visibleArticles[0].classList.add("enhanced_activty_selected");
    }
    else
    {
        ScrollToTargetSmoothly(visibleArticles[visibleArticles.length - 1]);
        visibleArticles[visibleArticles.length - 1].classList.add("enhanced_activty_selected");
    }
}

function ScrollToTargetSmoothly(elem)
{
    // window.scrollTo({
    //     top: elem.offsetTop - 64,
    //     behavior: "smooth"
    // });
    
    //64: Header Height
    window.scrollTo(0, elem.offsetTop - 64);
}

function VisibleEnhancedPowerModeCount()
{
    powerComboCnt += 1;
    powerComboTimeCnt = 0;

    document.getElementById("enhancedPowerModeScore").style.visibility = 'visible';
    document.getElementById("enhancedPowerModeScore").classList.add("enhanced_power_mode_score_enable");
    document.getElementById("enhancedPowerModeScore").innerText = "COMBO " + powerComboCnt;
    if (powerComboCnt > 100 && powerComboCnt < 300)
    {
        document.getElementById("enhancedPowerModeScore").classList.add("shake_text_s");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_l");
    }
    else if (powerComboCnt > 300 && powerComboCnt < 500)
    {  
        document.getElementById("enhancedPowerModeScore").classList.add("shake_text");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_s");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_l");
    }
    else if (powerComboCnt > 500)
    {
        document.getElementById("enhancedPowerModeScore").classList.add("shake_text_l");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text");
        document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_s");
    }
}

function InvisibleEnhancedPowerModeCount()
{
    powerComboCnt = 0;
    document.getElementById("enhancedPowerModeScore").style.visibility = 'hidden';
    document.getElementById("enhancedPowerModeScore").classList.remove("enhanced_power_mode_score_enable");
    StopEnhancedPowerModeShake();
}

function StopEnhancedPowerModeShake()
{
    document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_s");
    document.getElementById("enhancedPowerModeScore").classList.remove("shake_text");
    document.getElementById("enhancedPowerModeScore").classList.remove("shake_text_l");
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
        SetValue('enhancedFaviconTitle', document.getElementById('enhancedTxtHideLogoTitle').value);
        SetValue('enhancedFaviconURL', document.getElementById('enhancedTxtHideLogoFaviconURL').value);
        CloseSettingsPage();
    });

    $(document).on("change",'input[name="enhancedSelectTheme"]',function(){
        if (GetValue('enhancedSystemTheme', 'true') == 'false') {
            var theme = $('[name="enhancedSelectTheme"]:checked').val();
            SetValue("enhancedSelectTheme", theme);
            ChangeTheme(theme);
        }
    });

    $(document).on("change",'select[name="enhancedSelectDarkStyle"]',function(){
        var styleName = document.getElementById("enhancedOptionDarkTheme").value;
        var authorIdx = document.getElementById("enhancedOptionDarkTheme").selectedIndex;
        var authorEl = document.getElementById("themeAuthor");
        var authorLink = jThemes.themes[authorIdx].url;
        authorEl.innerText = jThemes.themes[authorIdx].author;
        authorEl.href = authorLink;
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
        document.getElementById("groupEnhancedFontCustomEnable").style.display = "none";
        SetFont();
    });

    $(document).on('click', '#enhancedFontNoto', function() {
        var fontName = "Pretendard";
        var fontCSS = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css";
        document.getElementById("enhancedTxtFontName").value = fontName;
        document.getElementById("enhancedTxtFontCSS").value = fontCSS;
        SetValue('enhancedFontName', fontName);
        SetValue('enhancedFontCSS', fontCSS);
        document.getElementById("groupEnhancedFontCustomEnable").style.display = "none";
        SetFont();
    });

    document.getElementById("enhancedFontCustom").addEventListener("click", function() {
        document.getElementById("groupEnhancedFontCustomEnable").style.display = "block";
    });

    $(document).on('click', '.close_btn_cls', function() {
        CloseSettingsPage();
    });

    document.getElementById("enhancedBtnBackupFriendsList").addEventListener("click", function() {
        BackupFriendsList();
    });

    document.getElementById("enhancedBtnBackupBannedUserList").addEventListener("click", function() {
        BackupBannedUserList();
    });

    document.getElementById("enhancedBtnUpdateInfo").addEventListener("click", function() {
        ViewUpdateAllPage();
    });

    $(document).on('click', '#enhancedBtnDeleteFriendConfirm', function() {
        DeleteFriendsConfirm();
    });

    $(document).on('click', '#enhancedBtnDeleteBlockedFriendConfirm', function() {
        DeleteBlockedFriendsConfirm();
    });

    $(document).on('click', '#deleteFriendConfirmCancel', function() {
        document.getElementById("deleteLayer").remove();
    });

    $(document).on('click', '#deleteFriendConfirmOK', function() {
        document.getElementById("deleteLayer").remove();
        DeleteFriendsReConfirm();
    });

    $(document).on('click', '#deleteBlockedFriendConfirmCancel', function() {
        document.getElementById("deleteBlockedLayer").remove();
    });

    $(document).on('click', '#deleteBlockedFriendConfirmOK', function() {
        LoadForDeleteFriends(true);
    });

    $(document).on('click', '#deleteFriendReConfirmCancel', function() {
        document.getElementById("deleteLayer").remove();
    });

    $(document).on('click', '#deleteFriendReConfirmOK', function() {
        LoadForDeleteFriends(false);
    });

    $(document).on('click', '#deleteFriendComplete', function() {
        document.getElementById("deleteLayer").remove();
        document.getElementById("deleteCountLayer").remove();
    });

    //Permission Maker
    $(document).on('click', '#enhancedBtnChangePermConfirm', function() {
        ChangePermissionConfirm();
    });

    $(document).on('click', '#changePermissionConfirmOK', function() {
        PrepareChangePermission();
    });

    $(document).on('click', '#changePermissionConfirmCancel', function() {
        document.getElementById("changePermLayer").remove();
    });

    $(document).on('click', '#changePermissionBtnOK', function() {
        document.getElementById("changePermLayer").remove();
        document.getElementById("changePermissionCountLayer").remove();
    });

    $(document).on("change",'input[name="enhancedSelectNotifyUse"]',function(){
        var changed = $('[name="enhancedSelectNotifyUse"]:checked').val();
        document.getElementById("groupEnhancedNotifyEnable").style.display = (changed == "true")? "block" : "none";
        SetValue("enhancedNotify", changed);
        if (GetValue("enhancedNotify", "false") == "true")
        {
            Notification.requestPermission();
        }
    });

    $(document).on("change",'input[name="enhancedSelectNotifySoundUse"]',function(){
        var changed = $('[name="enhancedSelectNotifySoundUse"]:checked').val();
        SetValue("enhancedNotifySound", changed);
        notyOption.silent = (changed == "true")? false : true;
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

    $(document).on("change",'input[name="enhancedSelectHideLogo"]',function(){
        var changed = $('[name="enhancedSelectHideLogo"]:checked').val();
        document.getElementById("groupEnhancedHideLogoEnable").style.display = (changed == "true")? "block" : "none";
        SetValue("enhancedHideLogo", changed);
    });

    $(document).on("change",'input[name="enhancedSelectHideLogoNoti"]',function(){
        var changed = $('[name="enhancedSelectHideLogoNoti"]:checked').val();
        SetValue("enhancedHideLogoNoti", changed);
    });

    $(document).on("change",'input[name="enhancedSelectLogoIcon"]',function(){
        var iconName = $('[name="enhancedSelectLogoIcon"]:checked').val();
        document.getElementById("groupEnhancedHideLogoCustomEnable").style.display = (iconName == "custom")? "block" : "none";
        SetValue("enhancedHideLogoIcon", iconName);
        currentFavicon = iconName;
        currentTitle = GetHideLogoIconTitle();
    });

    $(document).on("change",'input[name="enhnacnedSelectHideMemorize"]',function(){
        var changed = $('[name="enhnacnedSelectHideMemorize"]:checked').val();
        SetValue("enhancedHideMemorize", changed);
    });

    $(document).on("change",'input[name="enhancedSelectRecommendFriend"]',function(){
        var changed = $('[name="enhancedSelectRecommendFriend"]:checked').val();
        SetValue("enhancedHideRecommendFriend", changed);
        HideRecommendFriend();
    });

    $(document).on("change",'input[name="enhancedSelectEmoticonSize"]',function(){
        var size = $('[name="enhancedSelectEmoticonSize"]:checked').val();
        SetValue("enhancedEmoticonSize", size);
        SetEmoticonSize();
    });

    document.querySelectorAll('input[name="enhancedSelectKittyMode"]').forEach(function(element) {
        element.addEventListener('change', function() {
            let value = document.querySelector('input[name="enhancedSelectKittyMode"]:checked').value;
            SetValue("enhancedKittyMode", value);
            MoveKitty();
        });
    });

    document.querySelectorAll('input[name="enhancedSelectPuppyMode"]').forEach(function(element) {
        element.addEventListener('change', function() {
            let value = document.querySelector('input[name="enhancedSelectKittyMode"]:checked').value;
            SetValue("enhancedPuppyMode", value);
            MovePuppy();
        });
    });

    $(document).on("change",'input[name="enhancedSelectBlockUser"]',function(){
        var isEnhancedBlock = $('[name="enhancedSelectBlockUser"]:checked').val();
        document.getElementById("groupEnhancedBlockUser").style.display = (isEnhancedBlock == "true")? "block" : "none";
        if (isEnhancedBlock == "true")
        {
            GetBlockedUsers();
        }
        SetValue("enhancedBlockUser", isEnhancedBlock);
    });

    $(document).on("change",'input[name="enhancedSelectFeedBlockUser"]',function(){
        var isEnhancedFeedBlock = $('[name="enhancedSelectFeedBlockUser"]:checked').val();
        if (isEnhancedFeedBlock == "true")
        {
            GetFeedBlockedUsers();
        }
        SetValue("enhancedExtendFeedBlock", isEnhancedFeedBlock);
    });

    $(document).on("change",'input[name="enhancedSelectEarthquake"]',function(){
        var changed = $('[name="enhancedSelectEarthquake"]:checked').val();
        SetValue("enhancedEarthquake", changed);
    });

    $(document).on("change",'input[name="enhancedSelectBlink"]',function(){
        var changed = $('[name="enhancedSelectBlink"]:checked').val();
        SetValue("enhancedBlink", changed);
    });

    $(document).on("change",'input[name="enhancedSelectKeyboard"]',function(){
        var changed = $('[name="enhancedSelectKeyboard"]:checked').val();
        SetValue("enhancedKeyboard", changed);
    });

    $(document).on("change",'input[name="enhancedSelectBlockArticleAll"]',function(){
        var changed = $('[name="enhancedSelectBlockArticleAll"]:checked').val();
        SetValue("enhancedBlockArticleAll", changed);
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

    $('body').on('click', '#enhancedBtnCustomTheme', function() {
        document.getElementById("customThemeLayer").style.display = 'block';
    });

    $('body').on('click', '#enhancedBtnCustomThemeOK', function() {
        document.getElementById("customThemeLayer").style.display = 'none';
    });

    $('body').on('click', '#enhancedFastDeleteClose', function() {
        document.getElementById("fastDeleteLayer").remove();
    });

    $('body').on('click', '#enhancedBtnFastDeleteFriendConfirm', function() {
        OpenFastDeleteFriend();
    });

    $('body').on('click', '#enhancedKittyImage', function() {
        if (GetValue('enhancedKittyMode', 'none') == 'verycute') {
            catEffect.play();
            // var random = Math.floor(Math.random() * 2);
            // if (random == 0)
            //     catEffect.play();
            // else
            //     catEffect2.play();
        }
    });

    $('body').on('click', '#enhancedPuppyImage', function() {
        if (GetValue('enhancedPuppyMode', 'none') == 'verycute') {
            dogEffect.play();
        }
    });

    $(document).on("change",'input[name="enhancedSelectWideMode"]',function(){
        var changed = $('[name="enhancedSelectWideMode"]:checked').val();
        SetValue("enhancedWideMode", changed);
    });

    $(document).on("change",'input[name="enhancedSelectSidebarLocation"]',function(){
        var changed = $('[name="enhancedSelectSidebarLocation"]:checked').val();
        SetValue("enhancedSidebarLocation", changed);
        if (changed == "left")
        {
            LoadLeftSidebarCSS();
        }
        else
        {
            RemoveCSSCollection("enhancedLeftSidebarCSS");
        }
    });

    $(document).on('keypress', '#enhancedTxtFontSize', function(e) {
        if (e.keyCode == 13) {
            SetValue('enhancedFontSize', document.getElementById('enhancedTxtFontSize').value);
            SetFontSize();
        }
    });

    $(document).on('input', '#inputSlideThemeSaturation', function() {
        var saturation = document.getElementById("inputSlideThemeSaturation").value;
        SetValue('enhancedThemeSaturation', saturation);
        document.documentElement.style.setProperty('--saturation-factor', saturation);
        document.getElementById("enhancedTxtThemeSaturation").value = saturation;
    });

    $(document).on('keypress', '#enhancedTxtThemeSaturation', function(e) {
        if (e.key === 'Enter') {
            var saturation = document.getElementById('enhancedTxtThemeSaturation').value;
            SetValue('enhancedThemeSaturation', saturation);
            document.documentElement.style.setProperty('--saturation-factor', saturation);
            document.getElementById("inputSlideThemeSaturation").value = saturation;
        }
    });

    $(document).on('click', '#enhancedSettingsTitleThemeUI', function() {
        var elem = document.getElementById("enhancedSettingsContentThemeUI");
        if (!elem.classList.contains("enhanced_settings_content_hidden"))
        {
            elem.classList.add("enhanced_settings_content_hidden");
        }
        else
        {
            elem.classList.remove("enhanced_settings_content_hidden");
        }
    });

    $(document).on('click', '#enhancedSettingsTitleFont', function() {
        var elem = document.getElementById("enhancedSettingsContentFont");
        if (!elem.classList.contains("enhanced_settings_content_hidden"))
        {
            elem.classList.add("enhanced_settings_content_hidden");
        }
        else
        {
            elem.classList.remove("enhanced_settings_content_hidden");
        }
    });

    $(document).on('click', '#enhancedSettingsTitleNotification', function() {
        var elem = document.getElementById("enhancedSettingsContentNotification");
        if (!elem.classList.contains("enhanced_settings_content_hidden"))
        {
            elem.classList.add("enhanced_settings_content_hidden");
        }
        else
        {
            elem.classList.remove("enhanced_settings_content_hidden");
        }
    });

    $(document).on('click', '#enhancedSettingsTitleAdvancedBlock', function() {
        var elem = document.getElementById("enhancedSettingsContentAdvancedBlock");
        if (!elem.classList.contains("enhanced_settings_content_hidden"))
        {
            elem.classList.add("enhanced_settings_content_hidden");
        }
        else
        {
            elem.classList.remove("enhanced_settings_content_hidden");
        }
    });

    $(document).on('click', '#enhancedSettingsTitleEtc', function() {
        var elem = document.getElementById("enhancedSettingsContentEtc");
        if (!elem.classList.contains("enhanced_settings_content_hidden"))
        {
            elem.classList.add("enhanced_settings_content_hidden");
        }
        else
        {
            elem.classList.remove("enhanced_settings_content_hidden");
        }
    });

    $(document).on('click', '#enhancedSettingsTitleAddon', function() {
        var elem = document.getElementById("enhancedSettingsContentAddon");
        if (!elem.classList.contains("enhanced_settings_content_hidden"))
        {
            elem.classList.add("enhanced_settings_content_hidden");
        }
        else
        {
            elem.classList.remove("enhanced_settings_content_hidden");
        }
    });

    $(document).on('click', '#enhancedSettingsTitleInfo', function() {
        var elem = document.getElementById("enhancedSettingsContentInfo");
        if (!elem.classList.contains("enhanced_settings_content_hidden"))
        {
            elem.classList.add("enhanced_settings_content_hidden");
        }
        else
        {
            elem.classList.remove("enhanced_settings_content_hidden");
        }
    });
}

function LoadForDeleteFriends(blockedUserOnly) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            jsonMyFriends = JSON.parse(xmlHttp.responseText);

            var deleteCountLayer = document.createElement('div');
            deleteCountLayer.id = "deleteCountLayer";
            deleteCountLayer.className = "cover _cover";
            document.body.appendChild(deleteCountLayer);
            document.getElementById('deleteCountLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;"><div class="inner_toast_layer _toastBody"><p class="txt _dialogText" id="deleteFriendText">친구 삭제 중... (0 / 0)</p><div>※정책상 삭제 속도는 느리게 설정되었습니다.<br>취소하시려면 새로고침 하세요.</div><div class="btn_group"><a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteFriendComplete" style="display: none;"><span>확인</span></a> </div></div></div></div>';
            //deletedFriendCount = 0;
            if (blockedUserOnly)
            {
                VerifyBlockedUserForDeleteFriends();
            }
            DeleteFriends();
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/friends");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function VerifyBlockedUserForDeleteFriends()
{
    for (var i = 0; i < jsonMyFriends.profiles.length; i++)
    {
        if (!jsonMyFriends.profiles[i].hasOwnProperty("blocked") || jsonMyFriends.profiles[i]["blocked"] == false)
        {
            jsonMyFriends.profiles.splice(i, 1);
            i--;
        }
    }
}

function DeleteBlockedFriendsConfirm()
{
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "deleteBlockedLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('deleteBlockedLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div>' + 
                                                        '<div class="cover_wrapper" style="z-index: 201;">' + 
                                                        '<div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;">' +
                                                                '<div class="inner_toast_layer _toastBody">' + 
                                                                    '<p class="txt _dialogText">정말 제한된 사용자를 전체 삭제하시겠습니까?<br>취소하시려면 새로고침해야 합니다.</p>' +
                                                                    '<div class="btn_group">' + 
                                                                        '<a href="#" class="btn_com btn_wh _dialogCancel _dialogBtn" id="deleteBlockedFriendConfirmCancel"><span>취소</span></a>' + 
                                                                        '<a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteBlockedFriendConfirmOK"><span>확인</span></a>' +
                                                                    '</div>' +
                                                                '</div>' +
                                                            '</div>' +
                                                        '</div>';
}

function DeleteFriendsConfirm()
{
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "deleteLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('deleteLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div>' + 
                                                        '<div class="cover_wrapper" style="z-index: 201;">' + 
                                                        '<div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;">' +
                                                                '<div class="inner_toast_layer _toastBody">' + 
                                                                    '<p class="txt _dialogText">정말 친구를 전체 삭제하시겠습니까?<br>취소하시려면 새로고침해야 합니다.</p>' +
                                                                    '<div class="btn_group">' + 
                                                                        '<a href="#" class="btn_com btn_wh _dialogCancel _dialogBtn" id="deleteFriendConfirmCancel"><span>취소</span></a>' + 
                                                                        '<a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteFriendConfirmOK"><span>확인</span></a>' +
                                                                    '</div>' +
                                                                '</div>' +
                                                            '</div>' +
                                                        '</div>';
}

function DeleteFriendsReConfirm()
{
    var deleteLayer = document.createElement('div');
    deleteLayer.id = "deleteLayer";
    deleteLayer.className = "cover _cover";
    document.body.appendChild(deleteLayer);
    document.getElementById('deleteLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div>' + 
                                                        '<div class="cover_wrapper" style="z-index: 201;">' + 
                                                        '<div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;">' +
                                                                '<div class="inner_toast_layer _toastBody">' + 
                                                                    '<p class="txt _dialogText">정말 친구를 전체 삭제하시겠습니까?<br>진행하면 되돌릴 수 없습니다!<br>다시 한 번 신중하게 생각해주세요!<br>취소하시려면 새로고침해야 합니다.</p>' +
                                                                    '<div class="btn_group">' + 
                                                                        '<a href="#" class="btn_com btn_wh _dialogCancel _dialogBtn" id="deleteFriendReConfirmCancel"><span>취소</span></a>' + 
                                                                        '<a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="deleteFriendReConfirmOK"><span>확인</span></a>' +
                                                                    '</div>' +
                                                                '</div>' +
                                                            '</div>' +
                                                        '</div>';
}

function DeleteFriends() {
    setTimeout(function() {
        if (deletedFriendCount < jsonMyFriends.profiles.length) {
            _DeleteFriend(jsonMyFriends.profiles[deletedFriendCount]["id"]);
            document.getElementById('deleteFriendText').innerHTML = '친구 삭제 중... (' + (deletedFriendCount + 1) + ' / ' + jsonMyFriends.profiles.length + ')';
            deletedFriendCount++;
            DeleteFriends();
        } else {
            document.getElementById('deleteFriendText').innerHTML = '전체 삭제 완료';
            document.getElementById('deleteFriendComplete').style.display = 'block';
        }
    }, 300);
}

function _DeleteFriend(userid) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            //Deleted Message;
        }
    }
    xmlHttp.open("DELETE", "https://story.kakao.com/a/friends/" + userid);
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function ChangePermissionConfirm()
{
    var sourcePermissionElem = document.getElementById("enhancedOptionSourcePerm");
    var sourcePermissionText = sourcePermissionElem.options[sourcePermissionElem.selectedIndex].text;

    var changePermLayer = document.createElement('div');
    changePermLayer.id = "changePermLayer";
    changePermLayer.className = "cover _cover";
    document.body.appendChild(changePermLayer);
    document.getElementById('changePermLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div>' + 
                                                        '<div class="cover_wrapper" style="z-index: 201;">' + 
                                                        '<div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;">' +
                                                                '<div class="inner_toast_layer _toastBody">' + 
                                                                    '<p class="txt _dialogText">' + sourcePermissionText + ' 권한 게시글을 나만보기로 변경할까요? 취소하시려면 새로고침해야 합니다.</p>' +
                                                                    '<div class="btn_group">' + 
                                                                        '<a href="#" class="btn_com btn_wh _dialogCancel _dialogBtn" id="changePermissionConfirmCancel"><span>취소</span></a>' + 
                                                                        '<a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="changePermissionConfirmOK"><span>확인</span></a>' +
                                                                    '</div>' +
                                                                '</div>' +
                                                            '</div>' +
                                                        '</div>';
}

function _ChangePermission(articleID/*, perm, enableShare, commentWriteable, isMustRead*/)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            //Changed
        }
    }
    xmlHttp.open("PUT", "https://story.kakao.com/a/activities/" + articleID);
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.setRequestHeader("Accept-Language", "ko");
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
    xmlHttp.send("permission=M&enable_share=false&comment_all_writable=true&is_must_read=false");
}

function LoadActivitiesForPermission(userID, lastArticleID) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var activities = JSON.parse(xmlHttp.responseText);

            if (activities.length == 0) {
                jsonPermActivities = null;
                document.getElementById('changePermissionText').innerHTML = '게시글 권한이 성공적으로 변경되었습니다.';
                document.getElementById('changePermissionBtnOK').style.display = 'block';
                return;
            }

            jsonPermActivities = activities;

            SetPermissionActivities();
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/profiles/" + userID + "/activities?ag=false&since=" + lastArticleID);
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function SetPermissionActivities()
{
    setTimeout(function() {
        if (changeInternalPermCount < jsonPermActivities.length)
        {
            var activity = jsonPermActivities[changeInternalPermCount];
            
            var lArticleID = activity["sid"];
            var permission = activity["permission"];
            var sourcePermission = document.getElementById("enhancedOptionSourcePerm").value;
            /* For user-set permissions */
            //var isMustRead = activity["is_must_read"];
            //var commentWriteable = activity["comment_all_writable"];
            //var shareable = activity["shareable"];
            if (permission != 'M' && (permission == sourcePermission || sourcePermission == 'N'))
            {
                _ChangePermission(lArticleID/*, selNewPerm, shareable, commentWriteable, isMustRead*/);
            }

            document.getElementById('changePermissionText').innerHTML = '게시글 권한 변경 중... (' + (changePermCount + 1) + '/' + changePermActivityCount + '개 완료)';
            changePermCount++;
            changeInternalPermCount++;
            SetPermissionActivities();
        }
        else
        {
            changeInternalPermCount = 0;
            LoadActivitiesForPermission(changePermUserID, jsonPermActivities[jsonPermActivities.length - 1]["sid"]);
        }
    }, 550);
    
}

function PrepareChangePermission() {

    changePermCount = 0; //reset count

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var jsonProfile = JSON.parse(xmlHttp.responseText);
            changePermUserID = jsonProfile.id;
            changePermActivityCount = jsonProfile.activity_count;

            var permissionCountLayer = document.createElement('div');
            permissionCountLayer.id = "changePermissionCountLayer";
            permissionCountLayer.className = "cover _cover";
            document.body.appendChild(permissionCountLayer);
            document.getElementById('changePermissionCountLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="toast_popup cover_content cover_center" tabindex="-1" style="top: 436px; margin-left: -170px;"><div class="inner_toast_layer _toastBody"><p class="txt _dialogText" id="changePermissionText">게시글 권한 변경 중... (0 / 0)</p><div>※정책상 변경 속도는 느리게 설정되었습니다.<br>취소하시려면 새로고침 하세요.</div><div class="btn_group"><a href="#" class="btn_com btn_or _dialogOk _dialogBtn" id="changePermissionBtnOK" style="display: none;"><span>확인</span></a> </div></div></div></div>';
            LoadActivitiesForPermission(changePermUserID, "");
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/settings/profile");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function HideRecommendFriend()
{
    if (GetValue("enhancedHideRecommendFriend", "true") == "true")
        SetCSS("enhancedHideRecommendFriend", '.story_widgets > div[data-part-name="recommends"] { display: none !important; }');
    else
        RemoveCSSCollection("enhancedHideRecommendFriend");
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
    SetCSS("enhancedFontCSS", "body, button, input, select, td, textarea, th {font-family: '" + GetValue('enhancedFontName', 'Pretendard') + "', 'Nanum Gothic', 'Apple SD Gothic Neo', 'Apple SD 산돌고딕 네오' !important;}");
    SetCSS("enhancedFontURLCSS", "@import url(" + GetValue('enhancedFontCSS', 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css') + ");");
}

function SetFontSize() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var lines = xmlHttp.responseText.split("\n");
            for (var i = 0; i < lines.length; i++) {

                var originSize = parseInt(lines[i].split("font-size:")[1].split("px")[0]);
                var changedSize = originSize + parseInt(GetValue('enhancedFontSize', '0'));
                var modifiedCSS = lines[i].replace( originSize , changedSize);
                SetCSS('enhancedFontSizeCSS' + i, modifiedCSS);
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
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var lines = xmlHttp.responseText.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var variableName = lines[i].split(":")[0];
                var variableValue = lines[i].split(": ")[1].split(";")[0];
                document.documentElement.style.setProperty(variableName, variableValue);
            }
            document.documentElement.style.setProperty('--saturation-factor', GetValue('enhancedThemeSaturation', '1'));
            if (styleName == "custom_dark" || styleName == "custom_light")
            {
                document.getElementById("groupThemeGradientCustomTheme").style.display = 'block';
                SetCustomTheme();
            }
            else
            {
                document.getElementById("groupThemeGradientCustomTheme").style.display = 'none';
            }
        }
    }
    xmlHttp.open("GET", resourceURL + "theme_colors/" + styleName + ".css");
    xmlHttp.send();
}

function LoadThemeList() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            jThemes = JSON.parse(xmlHttp.responseText);
            for (var i = 0; i < jThemes.themes.length; i++)
            {
                var opTheme = document.getElementById("enhancedOptionDarkTheme").options;
                var op = new Option();
                op.value = jThemes.themes[i].id;
                op.text = jThemes.themes[i].name;

                opTheme.add(op);
            }

            var selectedDarkStyle = GetValue('enhancedDarkThemeStyle', 'discord');
            document.getElementById("enhancedOptionDarkTheme").value = selectedDarkStyle;
            var authorIdx = document.getElementById("enhancedOptionDarkTheme").selectedIndex;
            var authorEl = document.getElementById("themeAuthor");
            var authorLink = jThemes.themes[authorIdx].url;
            authorEl.innerText = jThemes.themes[authorIdx].author;
            authorEl.href = authorLink;
            if (GetValue('enhancedSelectTheme', 'dark') == 'dark')
            {
                SetDarkThemeStyle(selectedDarkStyle);
            }
        }
    }
    xmlHttp.open("GET", resourceURL + "theme_colors/themes.json");
    xmlHttp.send();
}

function LoadDarkThemeCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var darkcss = xmlHttp.responseText;
            SetCSS("enhancedDarkCSS", darkcss);
        }
    }
    xmlHttp.open("GET", resourceURL + "css/darktheme.css");
    xmlHttp.send();
}

function LoadEnhancedCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var darkcss = xmlHttp.responseText;
            SetCSS('enhancedCSS', darkcss);
        }
    }
    xmlHttp.open("GET", resourceURL + "css/enhanced.css");
    xmlHttp.send();
}

function LoadExtendFeedCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var darkcss = xmlHttp.responseText;
            SetCSS('enhancedExtendFeedCSS', darkcss);
        }
    }
    xmlHttp.open("GET", resourceURL + "css/extend_feed.css");
    xmlHttp.send();
}

function LoadExtendFeed1024CSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var darkcss = xmlHttp.responseText;
            SetCSS('enhancedExtendFeedCSS', darkcss);
        }
    }
    xmlHttp.open("GET", resourceURL + "css/extend_feed_1024.css");
    xmlHttp.send();
}

function LoadExtendFeedFlexibleCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var darkcss = xmlHttp.responseText;
            SetCSS('enhancedExtendFeedCSS', darkcss);
        }
    }
    xmlHttp.open("GET", resourceURL + "css/extend_feed_flexible.css");
    xmlHttp.send();
}

function LoadLeftSidebarCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var leftSideCSS = xmlHttp.responseText;
            SetCSS('enhancedLeftSidebarCSS', leftSideCSS);
        }
    }
    xmlHttp.open("GET", resourceURL + "css/left_sidebar.css");
    xmlHttp.send();
}

function LoadDevCSS() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var darkcss = xmlHttp.responseText;
            SetCSS("enhancedDevCSS", darkcss);
        }
    }
    xmlHttp.open("GET", resourceURL + "css/enhanced_comment_compact.css");
    xmlHttp.send();
}

function ChangeTheme(styleName)
{
    if (styleName == 'dark')
    {
        LoadDarkThemeCSS();
        SetDarkThemeStyle(GetValue('enhancedDarkThemeStyle', 'discord'));
    }
    else
    {
        $('style').remove(); //Remove Dark Theme CSS
        document.documentElement.style.setProperty('--lighter-background-color', '#dddddd'); //enhanced setting page textbox background
        document.documentElement.style.setProperty('--text-color', '#000000'); //enhanced setting page textbox color
        document.documentElement.style.setProperty('--text-highlight-color', '#000000'); //enhanced feature

        SetFont();
        SetFontSize();
        //SettingsV2 //Reload font css changed
        SetCSS('enhancedLightLogo', '.head_story .tit_kakaostory .link_kakaostory { background: url(\''+ resourceURL + 'images/logo_kseh.png\'); } ');
    }
    //hide original logo
    var hideOriginLogo = '.head_story .tit_kakaostory .logo_kakaostory { width: 0px !important; }'
    + '.head_story .tit_kakaostory .link_kakaostory { width: 145px !important; height: 27px !important; background-size: cover !important; }';
    SetCSS('enhancedHideLogoCSS', hideOriginLogo);
    LoadEnhancedCSS();
    //LoadDevCSS();
    if (GetValue('enhancedWideMode', 'false') == 'true' || GetValue('enhancedWideMode', 'false') == 'fixed')
    {
        LoadExtendFeedCSS();
    }
    else if (GetValue('enhancedWideMode', 'false') == 'fixed_1024')
    {
        LoadExtendFeed1024CSS();
    }
    else if (GetValue('enhancedWideMode', 'false') == 'flexible')
    {
        LoadExtendFeedFlexibleCSS();
    }

    if (GetValue('enhancedSidebarLocation', 'right') == 'left')
    {
        LoadLeftSidebarCSS();
    }
}

function GetLatestNotify() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var jsonNoty = JSON.parse(xmlHttp.responseText);
            var notyID = jsonNoty[0]["id"];
            var notyMessage = jsonNoty[0]["message"];
            var notyScheme = jsonNoty[0]["scheme"];
            var notyContent = jsonNoty[0]["content"];
            var notyURL = String(notyScheme).split("/");
            notyURL = notyURL[notyURL.length-1].replace(".", "/");
            if (String(notyID) != GetValue('enhancedLatestNotyID', ''))
            {
                SetValue('enhancedLatestNotyID', String(notyID));
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

function SetNotify(content, title_, url)
{
    notyOption.body = content;
    /*
    notyOption.onclick = function(e) {
        e.preventDefault();
        window.open("https://story.kakao.com/" + url, '_blank');
    }
    */

    new Notification(title_, notyOption);
}

function SaveText(text, name, type, btnID) {
    var btnEl = document.getElementById(btnID);
    var file = new Blob([text], {type: type});
    btnEl.href = URL.createObjectURL(file);
    btnEl.download = name;
}

function BackupFriendsList() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var jsonFriends = JSON.parse(xmlHttp.responseText);
            var friendsText = '';
            for (var i = 0; i < jsonFriends.profiles.length; i ++) {
                friendsText = friendsText + String(jsonFriends.profiles[i]["display_name"]) + " : " + String(jsonFriends.profiles[i]["id"]) + '\n';
            }
            document.getElementById("enhancedFriendsBackupDescription").innerHTML = "※백업 데이터가 생성 되었습니다! 한번 더 클릭하여 다운로드를 진행하세요.<br>만약 다운로드가 진행되지 않을 경우, 우클릭하여 다른 이름으로 링크 저장을 사용해보세요.<br>다시 새로운 정보로 다운로드 하시려면, 새로고침이 필요합니다.";
            SaveText(friendsText, "친구목록백업.txt", "text/plain", "enhancedBtnBackupFriendsList");
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/friends");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function BackupBannedUserList() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var jsonBannedUsers = JSON.parse(xmlHttp.responseText);
            var bannedUsersText = '';
            for (var i = 0; i < jsonBannedUsers.length; i ++) {
                bannedUsersText = bannedUsersText + String(jsonBannedUsers[i]["display_name"]) + " : " + String(jsonBannedUsers[i]["id"]) + '\n';
            }
            document.getElementById("enhancedBannedUserBackupDescription").innerHTML = "※백업 데이터가 생성 되었습니다! 한번 더 클릭하여 다운로드를 진행하세요.<br>만약 다운로드가 진행되지 않을 경우, 우클릭하여 다른 이름으로 링크 저장을 사용해보세요.<br>다시 새로운 정보로 다운로드 하시려면, 새로고침이 필요합니다.";
            SaveText(bannedUsersText, "차단목록백업.txt", "text/plain", "enhancedBtnBackupBannedUserList");
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/bans");
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
    let emoticonSize = GetValue("enhancedEmoticonSize", 'small');
    if (emoticonSize === "small")
    {
        SetCSS('enhancedCommentEmoticonSize', '.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 64px !important; height: 64px !important; }');
        SetCSS('enhancedArticleEmoticonSize', '.fd_cont .txt_wrap .kakao_emoticon { width: 84px !important; height: 84px !important; }');
        SetCSS('enhancedWriteEmoticonSize', '.write .inp_contents .sticon { height: 84px !important; }')
    } else if (emoticonSize === "middle")
    {
        SetCSS('enhancedCommentEmoticonSize', '.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 96px !important; height: 96px !important; }');
        SetCSS('enhancedArticleEmoticonSize', '.fd_cont .txt_wrap .kakao_emoticon { width: 96px !important; height: 96px !important; }');
        SetCSS('enhancedWriteEmoticonSize', '.write .inp_contents .sticon { height: 96px !important; }')
    } else
    {
        SetCSS('enhancedCommentEmoticonSize', '.comment .comt_write .inp_write .inp_graphic .kakao_emoticon, .comment .list>li .txt .emoticon .kakao_emoticon { width: 128px !important; height: 128px !important; }');
        SetCSS('enhancedArticleEmoticonSize', '.fd_cont .txt_wrap .kakao_emoticon { width: 128px !important; height: 128px !important; }');
        SetCSS('enhancedWriteEmoticonSize', '.write .inp_contents .sticon { height: 128px !important; }')
    }
}

function SetEmoticonSelectorSize()
{
    var sSize = GetValue("enhancedEmoticonSize", 'small');

    if (sSize == "middle")
    {
        SetCSS('enhancedEmoticonSelectorItemSize', '.emoticon_keyboard .emt_il .emt_il_item { width: 96px !important; height: 96px !important; } .emoticon_keyboard .emt_il img { width: 96px !important; height: 96px !important; }')
        SetCSS('enhancedEmoticonSelectorBoxSize', '.write .section .inp_footer .emoticon_layer { width: 500px !important; } .emoticon_keyboard .emoticon_item_list { height: 350px !important; } .emoticon_layer { width: 500px !important; }')
    }
    else if (sSize == "big")
    {
        SetCSS('enhancedEmoticonSelectorItemSize', '.emoticon_keyboard .emt_il .emt_il_item { width: 128px !important; height: 128px !important; } .emoticon_keyboard .emt_il img { width: 128px !important; height: 128px !important; }')
        SetCSS('enhancedEmoticonSelectorBoxSize', '.write .section .inp_footer .emoticon_layer { width: 630px !important; } .emoticon_keyboard .emoticon_item_list { height: 450px !important; } .emoticon_layer { width: 630px !important; }')
    }
    
}

function HideBlockedUserComment() {
    var comments = document.getElementsByClassName("_commentContent");
    for (var i = 0; i < comments.length; i++) {
        var bannedID = comments[i].getElementsByClassName("txt")[0].getElementsByTagName("p")[0].getElementsByTagName("a")[0].getAttribute("href").replace("/", "");

        if (blockedList.has(bannedID) === true || feedBlockedList.has(bannedID) === true) {
            comments[i].parentElement.style.display = 'none';
            /*
            comments[i].parentElement.remove();
            i -= 1; // only for remove()
            */
        }
    }
}

function HideBlockedUserArticle()
{
    var articles = document.getElementsByClassName("section _activity");
    for (var i = 0; i < articles.length; i++)
    {
        if (articles[i].getElementsByClassName("fd_cont _contentWrapper").length <= 0) //this is not article
        {
            continue;
        }

        var content = articles[i].getElementsByClassName("fd_cont _contentWrapper")[0];

        if (content.getElementsByClassName("share_wrap share_wrap_v2").length <= 0) //this is not shared article
        {
            continue;
        }

        var shared_content = content.getElementsByClassName("share_wrap share_wrap_v2")[0];
        
        if (shared_content.getElementsByClassName("pf") <= 0) //???
        {
            continue;
        }

        var profile_info = shared_content.getElementsByClassName("pf")[0];
        var bannedID = profile_info.getElementsByTagName("a")[0].getAttribute("href").replace("/", "");

        if (blockedList.has(bannedID) == true || feedBlockedList.has(bannedID) == true) {

            //not used.
            /*
            if (GetValue('enhancedBlockArticleAll', 'true') == 'false')
            {
                shared_content.style.display = 'none';
                continue;
            }
            */

            articles[i].style.display = 'none';
            /*
            comments[i].parentElement.remove();
            i -= 1; // only for remove()
            */
        }

    }

    var bundle_articles = document.getElementsByClassName("section section_bundle");
    for (var i = 0; i < bundle_articles.length; i++)
    {
        if (bundle_articles[i].getElementsByClassName("fd_cont").length <= 0) //this is not valid bundled article
        {
            continue;
        }

        var content = bundle_articles[i].getElementsByClassName("fd_cont")[0];

        if (content.getElementsByClassName("_bundleContainer").length <= 0) //this is not valid bundled article
        {
            continue;
        }

        if (content.querySelector("div[data-part-name='originalActivity']") == null) //this is not valid bundled article
        {
            continue;
        }

        var profile_info = content.querySelector("div[data-part-name='originalActivity']").getElementsByClassName("pf")[0];
        var bannedID = profile_info.getElementsByTagName("a")[0].getAttribute("href").replace("/", "");

        if (blockedList.has(bannedID) == true) {

            //not used.
            /*
            if (GetValue('enhancedBlockArticleAll', 'true') == 'false')
            {
                shared_content.style.display = 'none';
                continue;
            }
            */

            bundle_articles[i].style.display = 'none';
            /*
            comments[i].parentElement.remove();
            i -= 1; // only for remove()
            */
        }

    }
}

function GetFeedBlockedUsers()
{
    var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                feedBlockedList.clear();
                var friends = JSON.parse(xmlHttp.responseText);
                for (var i = 0; i < friends.profiles.length; i++)
                {
                    var isFeedBlocked = friends['profiles'][i]['is_feed_blocked'];
                    let friendID = friends['profiles'][i]['id'];
                    if (isFeedBlocked == true)
                    {
                        feedBlockedList.add(friendID);
                    }
                }
            }
        }
        xmlHttp.open("GET", "https://story.kakao.com/a/friends");
        xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
        xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
        xmlHttp.setRequestHeader("Accept", "application/json");
        xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xmlHttp.send();
}

function GetBlockedUsers() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var jsonBlocked = JSON.parse(xmlHttp.responseText);
            blockedList.clear();
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
    var blockStringLayer = document.createElement('div');
    blockStringLayer.id = "banStringLayer";
    blockStringLayer.className = "cover _cover";
    document.body.appendChild(blockStringLayer);
    document.getElementById('banStringLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="dim_ly cover_content cover_center" data-kant-group="msg.w"><div class="ly_con message" style="top:84px"><div class="_container box_writing"><fieldset><legend class="tit_message">문자열 차단</legend><div class="box_from _receiverWrap" data-model="c56736" data-part-name="receiver"><div class="_suggestionWrap friends_search" style="display: block;"><label class="_suggestionInputPlaceholder lab_from" for="messageReceiver">차단할 문자열을 한줄에 하나씩 입력하세요.</label></div></div><div class="box_write color_11" data-model="c56736" data-part-name="writing"><div class="editable"><span class="write_edit" style="top: 162px;"><textarea class="tf_write _texxtarea" id="textBlockString" style="font-size: 22px; line-height: 26px; height: 370px;"></textarea></span> <span class="edit_gap"></span></div></div><div class="box_media menu_on"><div class="bn_group"><a href="#" class="btn_com _sendMessage btn_or" id="enhancedBtnSaveBlockString" data-kant-id="574"><em>저장</em></a></div></div><a href="#" class="link_close _hideWritingView" id="enhancedBtnCancelBlockString"><span class="ico_ks ico_close">취소</span></a></fieldset></div></div></div></div>';
    document.getElementById("textBlockString").value = GetValue('enhancedBlockStringList', '');
}

function InitCustomThemePage() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var html = xmlHttp.responseText;

            var customThemeLayer = document.createElement('div');
            customThemeLayer.id = "customThemeLayer";
            customThemeLayer.className = "cover _cover";
            customThemeLayer.style.display = "none";
            document.body.appendChild(customThemeLayer);
            document.getElementById('customThemeLayer').innerHTML = html;
            InitCustomThemeValues();
            InitCustomThemePageEvents();
        }
    }
    xmlHttp.open("GET", resourceURL + "enhanced_custom_theme_settings.html");
    xmlHttp.send();
}

function InitCustomThemeValues()
{
    for (var i = 1; i <= 3; i++)
    {
        var color = GetValue('enhancedCustomThemeColor' + i, GetRandomHexColor());
        document.getElementById("enhancedCustomThemeColor" + i).value = color;
        document.getElementById("enhancedCustomThemePercent" + i).value = GetValue('enhancedCustomThemePercent' + i, Math.floor(Math.random() * 100));
        var isBright = IsBrightColor(color);
        var el = document.getElementsByClassName("enhanced_custom_gradient_color_" + i);
        for (var j = 0; j < el.length; j++)
        {
            el[j].style.backgroundColor = color;
            el[j].style.color = (isBright)? 'black' : 'white';
        }
    }

    document.getElementById("enhancedCustomThemeDegree").value = GetValue('enhancedCustomThemeDegree', Math.floor(Math.random() * 360));
}

function InitCustomThemePageEvents()
{
    document.getElementById("enhancedCustomThemeColor1").addEventListener("input", function() {
        let color = this.value;
        CustomThemeColorEventFunc(color, 1);
    });
    
    document.getElementById("enhancedCustomThemeColor2").addEventListener("input", function() {
        var color = this.value;
        CustomThemeColorEventFunc(color, 2);
    });

    document.getElementById("enhancedCustomThemeColor3").addEventListener("input", function() {
        var color = this.value;
        CustomThemeColorEventFunc(color, 3);
    });

    document.getElementById("enhancedCustomThemePercent1").addEventListener("input", function() {
        SetValue('enhancedCustomThemePercent1', this.value);
        SetCustomTheme();
    });

    document.getElementById("enhancedCustomThemePercent2").addEventListener("input", function() {
        SetValue('enhancedCustomThemePercent2', this.value);
        SetCustomTheme();
    });

    document.getElementById("enhancedCustomThemePercent3").addEventListener("input", function() {
        SetValue('enhancedCustomThemePercent3', this.value);
        SetCustomTheme();
    });

    document.getElementById("enhancedCustomThemeDegree").addEventListener("input", function() {
        SetValue('enhancedCustomThemeDegree', this.value);
        SetCustomTheme();
    });

    document.getElementById("enhancedBtnRandomCustomColor").addEventListener("click", function() {
        for (var i = 1; i <= 3; i++)
        {
            document.getElementById("enhancedCustomThemeColor" + i).value = GetRandomHexColor();
            let percent = Math.floor(Math.random() * 33) + ((i - 1) * 33) + 1;
            document.getElementById("enhancedCustomThemePercent" + i).value = percent;
            SetValue('enhancedCustomThemePercent' + i, percent);
            CustomThemeColorEventFunc(document.getElementById("enhancedCustomThemeColor" + i).value, i);
        }

        let degree = Math.floor(Math.random() * 360);
        document.getElementById("enhancedCustomThemeDegree").value = degree;
        SetValue('enhancedCustomThemeDegree', degree);
        SetCustomTheme();
    });
}

function CustomThemeColorEventFunc(color, i)
{
    if (!IsValidHexColor(color))
    {
        return;
    }
    SetValue('enhancedCustomThemeColor' + i, color);
    var isBright = IsBrightColor(color);
    var el = document.getElementsByClassName("enhanced_custom_gradient_color_" + i);
    for (var j = 0; j < el.length; j++)
    {
        el[j].style.backgroundColor = color;
        el[j].style.color = (isBright)? 'black' : 'white';
    }

    SetCustomTheme();
}

function SetCustomTheme()
{
    for (var i = 1; i <= 3; i++)
    {
        document.documentElement.style.setProperty('--bg-gradient-custom-' + i + '-hsl', GetHSLCSS(document.getElementById("enhancedCustomThemeColor" + i).value));
    }

    var percent1 = GetValue('enhancedCustomThemePercent1', Math.floor(Math.random() * 100));
    var percent2 = GetValue('enhancedCustomThemePercent2', Math.floor(Math.random() * 100));
    var percent3 = GetValue('enhancedCustomThemePercent3', Math.floor(Math.random() * 100));
    document.documentElement.style.setProperty('--custom-background-color', GetGradientCSS(percent1, percent2, percent3, GetValue('enhancedCustomThemeDegree', Math.floor(Math.random() * 360))));
    document.documentElement.style.setProperty('--saturation-factor', GetValue('enhancedThemeSaturation', '1'));
}

function IsValidHexColor(hexColor)
{
    return /^#[0-9A-F]{6}$/i.test(hexColor);
}

function GetRandomHexColor()
{
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}

function IsBrightColor(hexColor)
{
    var rgb = HexToRGB(hexColor);
    var brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    return brightness > 125;
}

function GetHSLCSS(hexColor)
{
    var rgb = HexToRGB(hexColor);
    var hsl = RGBToHSL(rgb);
    //000 calc(var(--saturation-factor, 1)*0%) 100%;
    //115 calc(var(--saturation-factor, 1)*10.5%) 42.9%;
    return hsl[0] + ' calc(var(--saturation-factor, 1)*' + hsl[1] + '%) ' + hsl[2] + '%';
}

function GetGradientCSS(percent1, percent2, percent3, degree)
{
    return 'linear-gradient(' + degree + 'deg, var(--bg-gradient-custom-1) ' + percent1 + '%, var(--bg-gradient-custom-2) ' + percent2 + '%, var(--bg-gradient-custom-3) ' + percent3 + '%)';
}

function HexToRGB(hexColor) {
    const rgb = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
    const [r, g, b] = [rgb.slice(0, 2), rgb.slice(2, 4), rgb.slice(4, 6)].map((hex) => Number.parseInt(hex, 16));
  
    return [r, g, b];
  }

function RGBToHSL(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const l = Math.max(r, g, b);
    const s = l - Math.min(r, g, b);
  
    const h = s
      ? l === r
        ? (g - b) / s
        : l === g
        ? 2 + (b - r) / s
        : 4 + (r - g) / s
      : 0;
    return [
      60 * h < 0 ? 60 * h + 360 : 60 * h,
      100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
      (100 * (2 * l - s)) / 2,
    ];
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

function MovePuppy()
{
    var hasPuppy = document.getElementById("enhancedPuppyImage") != null;
    if (GetValue('enhancedPuppyMode', 'none') === 'none')
        {
            if (hasPuppy)
            {
                document.getElementById("enhancedPuppyImage").remove();
            }
            return;
        }
    if (!hasPuppy)
    {
        var puppy = document.createElement('div');
        puppy.className = 'enhanced_puppy_image';

        var puppyContainer = document.createElement('div');
        puppyContainer.id = 'enhancedPuppyImage';
        puppyContainer.className = 'enhanced_puppy';
        puppyContainer.appendChild(puppy);
        document.getElementById("kakaoHead").insertBefore(puppyContainer, document.getElementById("kakaoHead").firstChild);
    }
}

function MoveKitty()
{
    var hasKitty = document.getElementById("enhancedKittyImage") != null;
    if (GetValue('enhancedKittyMode', 'none') == 'none')
    {
        if (hasKitty)
        {
            document.getElementById("enhancedKittyImage").remove();
        }
        return;
    }
    if (!hasKitty)
    {
        var kitty = document.createElement('img');
        kitty.id = 'enhancedKittyImage';
        kitty.className = 'enhanced_kitty';
        kitty.src = resourceURL + "images/cat.gif";
        document.getElementById("kakaoHead").insertBefore(kitty, document.getElementById("kakaoHead").firstChild);
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

function SetCSS(elID, cssText)
{
    //GM_addStyle(cssText);
    var elem = document.createElement('style');
    elem.id = elID;
    document.head.appendChild(elem);
    document.getElementById(elID).innerHTML = cssText;
}

function RemoveCSSCollection(elID)
{
    var elem = document.getElementById(elID);
    if (elem != null)
    {
        elem.remove();
    }
}

function DownloadText(text, name, type) {
    var a = document.getElementById("a");
    var file = new Blob([text], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
}

function GetHideLogoIconTitle()
{
    var val = GetValue('enhancedHideLogoIcon', 'naver');
    if (val === 'naver')
    {
        return 'NAVER';
    }
    else if (val === 'youtube')
    {
        return 'YouTube';
    }
    else if (val === 'instagram')
    {
        return 'Instagram';
    }
    else if (val === 'custom')
    {
        return GetValue('enhancedFaviconTitle', 'NAVER');
    }
    else
    {
        return 'NAVER';
    }
}

function HideLogo()
{
    var link = document.querySelector("link[rel~='icon']");
    var icon = currentFavicon + ".ico";
    var addNotiEnabled = false;

    //innerText starts with (N) means notification

    if (GetValue("enhancedHideLogoNoti", 'false') == 'true' && document.getElementsByTagName('title')[0].innerText.startsWith('(N)'))
    {
        addNotiEnabled = true;
    }

    if (currentFavicon == 'custom')
    {
        icon = GetValue('enhancedFaviconURL', resourceURL + 'images/naver.ico');
    }

    var _title = currentTitle;
    if (addNotiEnabled)
    {
        _title = '(N) ' + currentTitle;
    }

    if (document.getElementsByTagName('title')[0].innerText == _title &&
        link.href.includes(icon))
    {
        return;
    }

    document.getElementsByTagName('title')[0].innerText = _title;

    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }

    if (currentFavicon == 'custom')
    {
        link.href = GetValue('enhancedFaviconURL', resourceURL + 'images/naver.ico');
    }
    else
    {
        link.href = resourceURL + "images/" + icon;
    }   
}

function SetClassicFavicon()
{
    var link = document.querySelector("link[rel~='icon']");

    if (link.href.includes("classic.ico") || link.href.includes("classic_noty.ico"))
    {
        return;
    }

    var faviLink = resourceURL + "images/classic.ico";

    if (document.getElementsByTagName('title')[0].innerText.includes("(N)"))
    {
        faviLink = resourceURL + "images/classic_noty.ico";
    }
    //document.getElementsByTagName('title')[0].innerText = "NAVER"

    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviLink;
}

function AddPowerModeScoreElements()
{
    var header = document.querySelectorAll('[data-part-name="gnbMenu"]')[0];
    var scoreElement = document.createElement('div');
    scoreElement.id = 'enhancedPowerModeScore';
    scoreElement.className = 'enhanced_power_mode_score';
    scoreElement.innerText = 'COMBO 120';
    scoreElement.style.visibility = 'hidden';
    header.appendChild(scoreElement);
}

/* For Login */
function LoadLoginDarkThemeCSS()
{
    document.documentElement.style.setProperty('--background-color', '#2f3136');
    document.documentElement.style.setProperty('--text-color', '#dcddde');
    document.documentElement.style.setProperty('--text-highlight-color', '#fff');
    document.documentElement.style.setProperty('--text-menu-color', '#b9bbbe');
    document.documentElement.style.setProperty('--discord-blue', '#7289da');
    document.documentElement.style.setProperty('--dark-background-color', '#202225');

    let elem = document.createElement('style');
    elem.id = 'enhancedLoginDarkThemeCSS';
    document.head.appendChild(elem);
    document.getElementById('enhancedLoginDarkThemeCSS').innerHTML =
        'body { background: var(--background-color) !important; }' +
        '.set_login .lab_choice { color: var(--text-color) !important; }' +
        '.doc-footer .txt_copyright { color: var(--text-color) !important; }' +
        'a { color: var(--text-highlight-color) !important; }' +
        '.cont_login a { color: var(--text-menu-color) !important; }' +
        '.doc-footer .service_info .link_info { color: var(--text-menu-color) !important; }' +
        '.item_select .link_selected { color: var(--text-menu-color) !important; }' +
        '.box_tf { border: solid 0px var(--text-highlight-color) !important; background: var(--dark-background-color) !important; padding-left: 10px; padding-right: 10px; }' +
        '.box_tf .tf_g { color: var(--text-color) !important; caret-color: auto !important; }' +
        '.info_tip, .line_or .txt_or { color: var(--text-color) !important;}' +
        '.info_tip .txt_tip { color: var(--discord-blue) !important; }' +
        '.box_tf .txt_mail { color: var(--text-color) !important; margin-right: 10px !important }' +
        '.doc-title .tit_service .logo_kakao { background: var(--background-color) url(/images/pc/logo_kakao.png) no-repeat 0 0 !important; background-size: 100px 80px !important; background-position: 0 -41px !important};';

}

function ChangeLoginTheme(theme)
{
    var btnElem = document.getElementById('enhancedLoginThemeChangeBtn');
    if (theme == 'dark')
    {
        LoadLoginDarkThemeCSS();
        SetValue('enhancedSelectThemeLogin', 'dark');
        btnElem.innerHTML = svgLight;
    }
    else if (theme == 'light')
    {
        document.querySelector('style').remove(); //Remove Dark Theme CSS
        SetValue('enhancedSelectThemeLogin', 'light');
        btnElem.innerHTML = svgDark;
    }
}

function AddVisitorCountLayer()
{
    var visitorCountLayer = document.createElement("div");
    visitorCountLayer.id = "enhancedVisitorCountLayer";
    visitorCountLayer.className = "profile_collection visitor_count_layer";
    document.getElementsByClassName("profile_collection")[0].parentElement.appendChild(visitorCountLayer);
    visitorCountLayer.innerHTML = '<fieldset><h4 class="tit_collection">방문자수</h4></br><div style=""><canvas id="visitorChartCanvas"></canvas></div></fieldset>';
}

function ParseVisitorCount(jsonData)
{
    var counterJSON = null;
    for (var i = 0; i < jsonData.length; i++)
    {
        if (jsonData[i].type == "visit_counter")
        {
            counterJSON = jsonData[i].object.items;
            break;
        }
    }

    if (counterJSON == null)
    {
        document.getElementById("enhancedVisitorCountLayer").style.display = 'none';
        return;
    }

    var labelData = ['', '', '', '', '', '', ''];
    var countData = [0, 0, 0, 0, 0, 0, 0];

    for (var i = 0; i < counterJSON.length; i++)
    {
        labelData[i] = counterJSON[i].date;
        countData[i] = (counterJSON[i].count == -1? 0 : counterJSON[i].count);
    }

    var chartCanvas = document.getElementById('visitorChartCanvas').getContext('2d');

    var visitChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: labelData,
            datasets: [
                {
                    fill: false,
                    data: countData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                    ],
                    borderWidth: 1
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    })
}

function ViewVisitorChart()
{
    if (document.getElementById("enhancedVisitorCountLayer") != null)
    {
        return;
    }

    if (document.getElementsByClassName("profile_collection").length < 1)
    {
        return;
    }

    var pathname = window.location.pathname;
    var pathList = pathname.split("/");
    if (pathList.length < 3)
    {
        return;
    }

    var curUserID = pathList[1];

    AddVisitorCountLayer();

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
            var highlights = JSON.parse(xmlHttp.responseText);
            
            ParseVisitorCount(highlights.highlight);
        }
    }
    xmlHttp.open("GET", "https://story.kakao.com/a/profiles/" + curUserID + "/highlight");
    xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
    xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
    xmlHttp.setRequestHeader("Accept", "application/json");
    xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xmlHttp.send();
}

function OpenFastDeleteFriend()
{
    var fastDeleteLayer = document.createElement('div');
    fastDeleteLayer.id = "fastDeleteLayer";
    fastDeleteLayer.className = "cover _cover";
    document.body.appendChild(fastDeleteLayer);
    document.getElementById('fastDeleteLayer').innerHTML = '<div class="dimmed dimmed50" style="z-index: 201;"></div><div class="cover_wrapper" style="z-index: 201;"><div class="story_layer story_feed_layer cover_content cover_center" data-kant-group="like"><div class="inner_story_layer _layerContainer" style="top: 630px;"><div class="layer_head"><strong class="tit_story">빠른 친구삭제</strong></div><div class="layer_body"><div class="fake_scroll"><ul id="enhancedFastDeleteTable" class="list_people list_people_v2 _listContainer" style="overflow-y: scroll;"></ul><div class="scroll" style="display: none; height: 60px;"><span class="top"></span><span class="bottom"></span></div></div></div><div class="layer_foot"><a href="#" class="btn_close _close" data-kant-id="false"><span id="enhancedFastDeleteClose" class="ico_ks ico_close">닫기</span></a></div></div></div></div>';
    document.body.scrollTop = 0;

    var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                var friends = JSON.parse(xmlHttp.responseText);
                for (var i = 0; i < friends.profiles.length; i++)
                {
                    let friendli = document.createElement('li');
                    var friendProfileImageL = friends['profiles'][i]['profile_image_url'];
                    var friendProfileImageS = friends['profiles'][i]['profile_thumbnail_url'];
                    var friendName = friends['profiles'][i]['display_name'];
                    let friendID = friends['profiles'][i]['id'];
                    friendli.id = "enhancedFastDelFriend_" + friendID;
                    document.getElementById("enhancedFastDeleteTable").appendChild(friendli);
                    document.getElementById("enhancedFastDelFriend_" + friendID).innerHTML = '<a href="/' + friendID + '" class="link_people"><span class="thumb_user"><span class="img_profile thumb_img"><img src="' + friendProfileImageL + '" width="36" height="36" data-image-src="' + friendProfileImageS + '" data-movie-src="" class="img_thumb" alt=""></span></span> <span class="info_user"><span class="inner_user"><span class="txt_user"><em class="tit_userinfo">' + friendName + '</em></span></span></span></a><div class="btn_group btn_group_v2"><a href="#" id="' + 'btnEnhancedFastDelFriend_' + friendID + '"class="btn_com btn_wh _acceptFriend fastDelBtn"><span>삭제</span></a></div>';
                    document.getElementById("btnEnhancedFastDelFriend_" + friendID).addEventListener("click", function() {
                        _DeleteFriend(friendID);
                        friendli.remove();
                    });
                    
                }
            }
        }
        xmlHttp.open("GET", "https://story.kakao.com/a/friends");
        xmlHttp.setRequestHeader("x-kakao-apilevel", "49");
        xmlHttp.setRequestHeader("x-kakao-deviceinfo", "web:d;-;-");
        xmlHttp.setRequestHeader("Accept", "application/json");
        xmlHttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xmlHttp.send();
}

function AddLoginThemeSelectButtonUI()
{
    var body = document.body;
    var btnElem = document.createElement('button');
    btnElem.id = 'enhancedLoginThemeChangeBtn';
    btnElem.innerHTML = svgDark;
    btnElem.style.height = '64px';
    btnElem.style.width = '64px';
    btnElem.style.background = 'none';
    btnElem.style.position = 'absolute';
    btnElem.style.right = '10px';
    btnElem.style.bottom = '10px';

    var theme = GetValue('enhancedSelectThemeLogin', 'dark');

    if (theme == 'dark')
    {
        btnElem.innerHTML = svgLight;
    }
    else if (theme == 'light')
    {
        btnElem.innerHTML = svgDark;
    }
    btnElem.onclick = function() {
        if (theme == 'dark')
        {
            theme = 'light';
        }
        else if (theme == 'light')
        {
            theme = 'dark';
        }

        ChangeLoginTheme(theme);
    }

    body.appendChild(btnElem);
}

function SetExtendCommentUI()
{
    var detailClass = document.getElementsByClassName("feed detail_desc _feedContainer");
    if (detailClass.length > 0)
    {
        return;
    }

    var commentClasses = document.getElementsByClassName("comment");
    for (var i = 0; i < commentClasses.length; i++)
    {
        let commentClass = commentClasses[i];
        let commentParent = commentClass.parentElement;
        let nextSibling = commentParent.nextElementSibling;

        if (!commentParent.className.includes('_activityBody'))
        {
            continue;
        }

        commentParent.removeChild(commentClass);

        if (nextSibling)
        {
            nextSibling.parentNode.insertBefore(commentClass, nextSibling);
        }
        else
        {
            commentParent.parentNode.appendChild(commentClass);
        }
    }
}

let birthdayTopRetryCount = 0;
function MoveBirthdayFriendsToTop()
{
    let els = document.getElementsByClassName("list_cate list_myfriend");
    if (els.length <= 0)
    {
        setTimeout(() => MoveBirthdayFriendsToTop(), 300);
        return;
    }

    let friendsEl = null;
    for (let i = 0; i < els.length; i++)
    {
        if (els[i].getAttribute("data-part-name") === "peopleList")
        {
            friendsEl = els[i];
            break;
        }
    }

    if (friendsEl == null)
    {
        setTimeout(() => MoveBirthdayFriendsToTop(), 300);
        return;
    }

    let friends = friendsEl.getElementsByTagName("li");

    if (friends.length <= 0)
    {
        birthdayTopRetryCount++;
        if (birthdayTopRetryCount < 10)
        {
            setTimeout(() => MoveBirthdayFriendsToTop(), 300);
        }
        return;
    }

    let lastIndex = -1;
    for (let i = 0; i < friends.length; i++)
    {
        if (friends[i].className.includes("user_birth"))
        {
            lastIndex = i;
            friendsEl.insertBefore(friends[i], friendsEl.firstChild);
        }
    }
}

(function() {
    /* Kakao Login Page */
    if (window.location.href.includes("accounts.kakao.com/login"))
    {
        AddLoginThemeSelectButtonUI();
        if (GetValue('enhancedSelectThemeLogin', 'dark') == 'dark')
        {
            ChangeLoginTheme('dark');
        }
        
        return;
    }
    /* KakaoStory */
    InitEnhancedSettingsPage();
    InitCustomThemePage();
    LoadCommonEvents();
    if (GetValue('enhancedBlockUser', 'true') == 'true')
    {
        GetBlockedUsers();
    }

    if (GetValue('enhancedExtendFeedBlock', 'false') == 'true')
    {
        GetFeedBlockedUsers();
    }
    
    SetEmoticonSelectorSize();

    setTimeout(() => AddEnhancedMenu(), 1000);
    setTimeout(() => MoveKitty(), 1000);
    setTimeout(() => MovePuppy(), 1000);
    setTimeout(() => GetMyID(), 3000); //for discord style mention feature
    setTimeout(() => HideChannelButton(), 500); //hide channel and teller buttons
    setTimeout(() => AddPowerModeScoreElements(), 1000); //power mode
    setTimeout(() => MoveBirthdayFriendsToTop(), 100); //move birthday friends to top

    setInterval(function() {
        if (GetValue('enhancedNotify', 'false') == 'true')
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
            HideBlockedUserArticle();
        }

        HideBlockStringArticle();

        ViewDetailNotFriendArticle();

        var hideLogoEnabled = (GetValue('enhancedHideLogo', 'false') == 'true');

        if (hideLogoEnabled == true)
        {
            setTimeout(() => HideLogo(), 750);
        }

        if (GetValue("enhancedFaviconClassic", "false") == "true" && !hideLogoEnabled)
        {
            setTimeout(() => SetClassicFavicon(), 750);
        }

        if (GetValue('enhancedWideMode', 'false') != 'false')
        {
            setTimeout(() => SetExtendCommentUI(), 750);
        }

        setTimeout(() => ViewVisitorChart(), 1000);

        if (GetValue('enhancedEarthquake', 'false') == 'true')
        {
            powerComboTimeCnt += 1;
            if (powerComboTimeCnt > 50)
            {
                InvisibleEnhancedPowerModeCount();
            }
        }

    }, 100);
})();