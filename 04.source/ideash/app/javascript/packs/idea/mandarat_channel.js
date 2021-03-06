import consumer from "../../channels/consumer"
import {checkControllerAction} from "../common/check_controller_action";

$(document).on("turbolinks:load", function () {
    if (!checkControllerAction(['mandarat'], ['edit'])) return

    let targetTimerInterval;
    let isUnlimitedMode;

    if ($('.websocket-mandarat').length > 0) {
        // const chatChannel = consumer.subscriptions.create({
        consumer.task = consumer.subscriptions.create({
                channel: 'IdeaChannel',
                idea: $('#idea_logs').data('idea_id')
            }, {
                connected() {
                    // Called when the subscription is ready for use on the server
                    this.perform('join_user');
                    return this.perform('pause');
                },

                disconnected() {
                    // Called when the subscription has been terminated by the server
                },

                received(idea_log) {

                    let query = idea_log['idea_logs']
                    let val = parseInt(localStorage.getItem('radio_value'));

                    //作成時
                    if (query['mode'] === 'join') {
                        let user_id = 'participant_' + query['user_id']
                        if ($('#' + user_id).length === 0) {
                            $('.users').append(`<li id="participant_${query['user_id']}"><i class="user circle icon">${query['join']['user_mail']}</i></li>`)
                        }
                    }
                    //編集時
                    if (query['mode'] === 'editing') {
                        let sel_num = parseInt(query["editing"]["object_id"]) - val;
                        let sel_class = '.t' + sel_num;
                        let sel_id = '#zoom_div_' +sel_num;
                        $(sel_class).css('background-color', '#C0C0C0');

                        let input_text = $(sel_id).text();
                        $(sel_id).text('');
                        $(sel_class).val(input_text);
                    }
                    //確定時
                    else if (query['mode'] === 'edit') {
                        let text = query["edit"]["content"];
                        let first1 = '.t';
                        let first2 = 'zoom_';
                        let first3 = '#zoom_div_';
                        let bigid = query["edit"]["object_id"];
                        let minid = bigid - val;
                        let sel_class = first1 + minid;
                        let sel_id = first2 + minid;
                        let sel_div_id =first3 +minid;

                        if(text.length>24) {
                            let clamptext = text.slice(0,23);
                            $('#' + bigid).text(clamptext+'.....');
                        }else {
                            $('#' + bigid).text(text);
                        }

                        array[bigid] = text;

                        if (minid >= 0 && minid <= 8) {
                            document.getElementById(sel_id).value = text;
                        }

                        $(sel_class).val('');
                        $(sel_div_id).text(text);
                        $(sel_class).css('background-color', '#FFFFFF');


                        if (Math.floor(bigid / 10) === 4) {
                            $('#theme' + bigid % 40).text(text);
                        }
                    } else if (query['mode'] === 'chat') {
                        var user_id = 'chatuser_' + query['user_id']
                        var user_name = escapeHTML(query['chat']['user_name'])
                        var chat_text = escapeHTML(query['chat']['content']);
                        var chat_div;
                        if ($('#user_id').val() === query['user_id']) {
                            chat_div = `<div class="ui right pointing label chat_message">${chat_text}</div>`
                        } else {
                            chat_div = `<div class="ui left pointing label chat_message">${chat_text}</div>`
                        }
                        if (user_id != $('.chat_content').first().attr('name')) {
                            $('.chat_contents').first().prepend(`
                        <div class="chat_content" name="chatuser_${query['user_id']}">
                            <h6 class="chat_username">${user_name}</h6>
                        </div>
                    `)
                        }
                        $('.chat_username').first().after(chat_div)
                    } else if (query['mode'] === 'system') {
                        if (query['system']['operation'] === 'stop') {
                            if (query['system']['option'] === 'process1') {
                                $('body')
                                    .toast({
                                        title: 'FINISH',
                                        message: '終了!!お疲れさまでした!!',
                                        showProgress: 'bottom',
                                        classProgress: 'blue'
                                    });
                            }
                        } else if (query['system']['operation'] === 'get_process_time') {
                            let process_times = query['system']['process_times'];
                            let process_words = ['アイデア出し：'];
                            $('#time0').text(process_words[0] + Math.floor(process_times[0]['time']/60) + '分');
                        }
                    } else if (query['mode'] === 'settime') {
                        console.log(idea_log)
                        let row_target_times = query['settime']['target_times'];
                        let target_times = []
                        for (let i in row_target_times) {
                            target_times.push(new Date(row_target_times[i]));
                        }
                        startTimer(target_times)
                    }
                },
                editing: function (content) {
                    return this.perform('editing',
                        content);
                },
                edit: function (content) {
                    return this.perform('edit',
                        content);
                },
                chat: function (idea_log) {
                    return this.perform('chat_send',
                        idea_log
                    );
                }
            }
        );

        //初回読み込み時の処理
        let array = {};
        for (let i = 0; i <= 8; i++) {
            for (let j = 0; j <= 8; j++) {
                let x = i * 10 + j;
                let text = $('input:hidden[name="read_' + x + '"]').val();
                array[x] = text;
                if(text.length>24) {
                    let clamptext = text.slice(0,23);
                    $('#' + x).text(clamptext+'....');
                }else {
                    $('#' + x).text(text);
                }
                if (i === 4 && x !== 44) {
                    $('#theme' + j).text(text);
                }
            }
        }
        let maintheme = $('#44_main_theme').val();
        $('#main').text(maintheme);

        //ズームイン画面の処理
        $(function () {
            for (let i = 0; i <= 8; i++) {
                let flg = false;
                $('#zoom_' + i)
                    //テキストボックスにフォーカス時
                    .focusin(function () {
                        //入力中にミニマップと矢印で移動できないように
                        $('#radio-btn').addClass('btn-invalid');
                        $('#to-up-button').addClass('btn-invalid');
                        $('#to-left-button').addClass('btn-invalid');
                        $('#to-right-button').addClass('btn-invalid');
                        $('#to-down-button').addClass('btn-invalid');
                        let val = parseInt(localStorage.getItem('radio_value'));
                        let objid = val + i;
                        let content = {object_id: objid};
                        consumer.task.editing(content);
                        //上か下一桁が4
                        if (((Math.floor(objid / 10) === 4) || (objid % 10 === 4)) && objid !== 44) {
                            //値の1桁目と2桁目を入れ替える
                            let pairObjid = Math.floor(objid / 10) + objid % 10 * 10;
                            content = {object_id: pairObjid};
                            consumer.task.editing(content)
                            flg = !flg;
                        }
                    })
                    //テキストボックスからフォーカス外したとき
                    .focusout(function (event) {
                        //入力中にミニマップと矢印で移動できないようにを解除
                        $('#radio-btn').removeClass('btn-invalid');
                        $('#to-up-button').removeClass('btn-invalid');
                        $('#to-left-button').removeClass('btn-invalid');
                        $('#to-right-button').removeClass('btn-invalid');
                        $('#to-down-button').removeClass('btn-invalid');
                        let val = parseInt(localStorage.getItem('radio_value'));
                        let text = event.delegateTarget.value;
                        let objid = val + i;
                        let content = {object_id: objid, content: text};
                        consumer.task.edit(content);
                        if (flg) {
                            let pairObjid = Math.floor(objid / 10) + objid % 10 * 10;
                            let content = {object_id: pairObjid, content: text};
                            consumer.task.edit(content);
                            flg = !flg;
                        }
                    });
            }
        });
        //左上のミニマップ選択された後
        let $minimap = $('[data-minimap="true"]')
        $minimap.on('click change',function(){
            let minimapId = $(this).data("minimap-id");
            $minimap.removeClass("selected-mandarat-minimap")
            $(this).addClass("selected-mandarat-minimap")
            if (minimapId === 40) {
                $('#zoom_4').prop('disabled', true);
            } else {
                $('#zoom_4').prop('disabled', false);
            }
            // 初期化と連想配列内の値表示
            for (let i = 0; i < 9; i++) {
                let aryid = minimapId + i;
                let zoom_div_first = '#zoom_div_';
                $(zoom_div_first + i).text('');
                $(zoom_div_first + i).text(array[aryid]);
            }
            localStorage.setItem('radio_value', minimapId);
        });

        //最初は中央を選択する
        $(`[data-minimap-id=40]`).prop('checked', true).change();

        //矢印ボタンでミニマップを移動
        $(function () {
            $('#to-up-button').on('click', upbtn);
            $('#to-left-button').on('click', leftbtn);
            $('#to-right-button').on('click', rightbtn);
            $('#to-down-button').on('click', downbtn);

            function upbtn() {
                let radioval = parseInt(localStorage.getItem('radio_value')) - 30;
                if (radioval >= 0) {
                    $(`[data-minimap-id=${radioval}]`).prop('checked', true).change();
                }
            }

            function leftbtn() {
                let radioval = parseInt(localStorage.getItem('radio_value')) - 10;
                if (radioval % 30 !== 20) {
                    $(`[data-minimap-id=${radioval}]`).prop('checked', true).change();
                }
            }

            function rightbtn() {
                let radioval = parseInt(localStorage.getItem('radio_value')) + 10;
                if (radioval % 30 !== 0) {
                    $(`[data-minimap-id=${radioval}]`).prop('checked', true).change();
                }
            }

            function downbtn() {
                let radioval = parseInt(localStorage.getItem('radio_value')) + 30;
                if (radioval <= 80) {
                    $(`[data-minimap-id=${radioval}]`).prop('checked', true).change();
                }
            }
        });

        //チャット
        $(document).on('keypress', '[data-behavior~=idea_speaker]', function (event) {
            if (event.keyCode === 13) {
                if (!event.target.value.match(/\S/g)) return false
                let content = {
                    content: event.target.value
                };
                if (event.target.id === 'idea_chat') {
                    consumer.task.chat(content);
                }
                event.target.value = '';
                return event.preventDefault();
            }
        });

        //全体面とズーム画面の切替
        $('#process_1').hide()
        $(function () {
            $('#allview').on('click', allview);
            $('#zoomview').on('click', zoomview);

            function allview() {
                $('#process_2').hide()
                $('#process_1').show()
            }

            function zoomview() {
                $('#process_1').hide()
                $('#process_2').show()
            }
        });
    } else {
        if (consumer.task) {
            consumer.task.unsubscribe()
        }
    }

    function startTimer(target_times) {
        target_times.sort();
        targetTimerInterval = setInterval(showTimer, 1000, target_times)
    }

    function showTimer(target_times = []) {
        //ひとつ目がない
        if (target_times.length === 0) {
            clearInterval(targetTimerInterval);
            return
        }
        let targetDate = new Date(target_times[0]);
        targetDate.setHours(targetDate.getHours() + 9);
        let nowDate = new Date();
        let showNowDate = nowDate.getHours() + ':'
            + nowDate.getMinutes() + ':'
            + nowDate.getSeconds();
        let diffTime = targetDate - nowDate;
        //あるので表示
        if (diffTime > 0) {
            let dMin = diffTime / (1000 * 60);   // 分
            diffTime = diffTime % (1000 * 60);
            let dSec = diffTime / 1000;   // 秒
            let msg = Math.floor(dMin) + "分"
                + Math.floor(dSec) + "秒";
            $('#time_title').text('残り時間');
            $('#remaining').text(msg);
        } else if (isUnlimitedMode) {
            $('#time_title').text('現在時刻');
            $('#remaining').text(showNowDate);
        } else {
            clearInterval(targetTimerInterval);
            target_times.shift()
            targetTimerInterval = setInterval(showTimer, 1000, target_times)
            if (target_times.length === 0) {
                $('#time_title').text('残り時間');
                $('#remaining').text('終了');
            }

        }
    }
});

// NOTE: エスケープ処理
const escapeHTML = function (val) {
    return $('<div />').text(val).html();
};
