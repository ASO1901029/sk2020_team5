require('fomantic-ui-css/semantic.min');
$(function () {
        toast_updated()
    }
)

function toast_updated() {
    let is_updated = $('#is_updated').val();
    // 初回時は空白になるのでそのまま返す
    if (is_updated === "") return;
    let user_name = $('#account_input').val();
    console.log(is_updated)
    if (is_updated) {
        $('body')
            .toast({
                title: 'SUCCESS',
                message: user_name + 'に更新しました',
                showProgress: 'bottom',
                classProgress: 'blue'
            });
    } else {
        $('body')
            .toast({
                title: 'FAILURE',
                message: '更新に失敗しました。',
                showProgress: 'bottom',
                classProgress: 'red'
            });
    }
}
