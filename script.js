document.addEventListener('DOMContentLoaded', function() {
    // 12桁のランダム英数字ID生成関数
    const generateUniqueId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        const randomValues = new Uint8Array(12);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < 12; i++) {
            result += chars[randomValues[i] % chars.length];
        }
        return result;
    };

    // メニュー項目のチェックボックスと数量入力の連動
    // フォーム内のメニュー項目コンテナ（grid gap-3 の直下にある div）をすべて取得
    const menuItems = document.querySelectorAll('form .grid.gap-3 > div');

    menuItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const quantityInput = item.querySelector('input[type="number"]');

        if (checkbox && quantityInput) {
            // チェックボックスが変更されたときの処理
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    // チェックが入った時、数量が空または0なら1にする
                    if (quantityInput.value === '' || parseInt(quantityInput.value) === 0) {
                        quantityInput.value = 1;
                    }
                } else {
                    // チェックが外れた時、数量をクリアする
                    quantityInput.value = '';
                }
            });

            // 数量が変更されたときの処理（数量が入ったら自動でチェックを入れる）
            quantityInput.addEventListener('input', function() {
                checkbox.checked = (this.value && parseInt(this.value) > 0);
            });
        }
    });

    // モーダル要素の取得
    const modal = document.getElementById('confirmation-modal');
    const modalItems = document.getElementById('modal-order-items');
    const modalTotal = document.getElementById('modal-total-amount');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    let pendingFormData = null;
    
    // 完了モーダル要素の取得
    const completionModal = document.getElementById('completion-modal');
    const completionOrderId = document.getElementById('completion-order-id');
    const completionCloseBtn = document.getElementById('completion-close-btn');

    // モーダル操作
    const openModal = () => {
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    };
    const closeModal = () => {
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    };

    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // 完了モーダル操作
    const openCompletionModal = (orderId) => {
        if (completionModal) {
            completionModal.classList.remove('hidden');
            completionModal.classList.add('flex');
            
            // 注文ID表示
            if (completionOrderId) completionOrderId.textContent = orderId;

            // QRコード生成
            const qrcodeContainer = document.getElementById('qrcode');
            if (qrcodeContainer) {
                qrcodeContainer.innerHTML = ''; // クリア
                new QRCode(qrcodeContainer, {
                    text: orderId,
                    width: 128,
                    height: 128,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            }
        }
    };

    if (completionCloseBtn) {
        completionCloseBtn.addEventListener('click', function() {
            if (completionModal) {
                completionModal.classList.add('hidden');
                completionModal.classList.remove('flex');
            }
            // フォームのリセット
            const orderForm = document.querySelector('form');
            if (orderForm) orderForm.reset();
            menuItems.forEach(item => {
                const input = item.querySelector('input[type="number"]');
                if(input) input.value = '';
            });
        });
    }

    // 確定ボタンクリック時の処理
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (!pendingFormData) return;

            // ★GASのデプロイ設定で「アクセスできるユーザー」を「全員(Anyone)」にしてください
            const SCRIPT_URL_ORDER = 'https://script.google.com/macros/s/AKfycbw3EqbVtjNXMeP5FP4isSH21thccOB4ojmzgIdNBVo2wv5c710ht9FUs6FYutyDMvwJ/exec';
            const SCRIPT_URL_DETAIL = 'https://script.google.com/macros/s/AKfycbxGDtidP7rFk3p1l6PB7h0jN3Ng6alpYcvVmdFT3ZGwDYGF03NPU1kjfxhUPw9-Mw6k/exec';
            
            // ボタンの状態変更
            const originalText = confirmBtn.textContent;
            confirmBtn.disabled = true;
            confirmBtn.textContent = '送信中...';

            // 並列で送信を実行
            Promise.all([
                fetch(SCRIPT_URL_ORDER, {
                    method: 'POST',
                    body: JSON.stringify(pendingFormData)
                }).then(res => res.json()),
                fetch(SCRIPT_URL_DETAIL, {
                    method: 'POST',
                    body: JSON.stringify(pendingFormData)
                }).then(res => res.json())
            ])
            .then(([orderData, detailData]) => {
                console.log('GAS Order Response:', orderData);
                console.log('GAS Detail Response:', detailData);
                
                closeModal();
                openCompletionModal(pendingFormData.id);
            })
            .catch(err => {
                alert('送信に失敗しました: ' + err);
            })
            .finally(() => {
                confirmBtn.disabled = false;
                confirmBtn.textContent = originalText;
            });
        });
    }

    // 注文フォームの送信処理
    const orderForm = document.querySelector('form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault(); // 通常の送信をキャンセル

            // 注文データの収集と合計金額の計算
            const orderItems = [];
            let totalAmount = 0;

            menuItems.forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                const quantityInput = item.querySelector('input[type="number"]');
                
                if (checkbox && checkbox.checked && quantityInput.value > 0) {
                    // HTMLから商品名と価格を取得
                    const nameElement = item.querySelector('.font-bold.text-stone-700, .font-bold.text-stone-800');
                    const priceElement = item.querySelector('.text-orange-600');
                    
                    if (nameElement && priceElement) {
                        const name = nameElement.textContent.trim();
                        const price = parseInt(priceElement.textContent.replace(/[^0-9]/g, '')); // ¥とカンマを除去して数値化
                        const quantity = parseInt(quantityInput.value);
                        const subtotal = price * quantity;

                        orderItems.push({ name, price, quantity, subtotal });
                        totalAmount += subtotal;
                    }
                }
            });

            if (orderItems.length === 0) {
                alert('注文するメニューを選択してください。');
                return;
            }

            // 送信データの作成
            const now = new Date();
            const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            pendingFormData = {
                id: 'ORD-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase(), // AppSheet用のユニークID
                timestamp: timestamp, // 注文日時
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                pickupTime: document.getElementById('pickup-time').value,
                orderDetails: orderItems.map(item => `${item.name} x${item.quantity}`).join('\n'),
                totalAmount: totalAmount,
                notes: document.getElementById('notes').value,
                items: orderItems.map((item, index) => ({
                    detailId: generateUniqueId(), // ID注文詳細（12桁の英数字）
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.subtotal
                }))
            };

            // モーダルに内容を表示
            if (modalItems && modalTotal) {
                modalItems.innerHTML = orderItems.map(item => `
                    <div class="flex justify-between py-1 border-b border-stone-100 last:border-0">
                        <span class="text-stone-700">${item.name} × ${item.quantity}</span>
                        <span class="font-bold text-stone-900">¥${item.subtotal.toLocaleString()}</span>
                    </div>
                `).join('');
                modalTotal.textContent = `¥${totalAmount.toLocaleString()}`;
                
                openModal();
            }
        });
    }
});