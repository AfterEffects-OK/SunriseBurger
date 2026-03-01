document.addEventListener('DOMContentLoaded', function() {
    // Hamburger Menu Toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            const menuIcon = this.querySelector('i');
            mobileMenu.classList.toggle('hidden');
            
            // Change icon between bars and times (X)
            if (mobileMenu.classList.contains('hidden')) {
                menuIcon.classList.replace('fa-times', 'fa-bars');
            } else {
                menuIcon.classList.replace('fa-bars', 'fa-times');
            }
        });
    }

    // ホーム画面のQRコード生成
    const homeQrcodeContainer = document.getElementById("home-qrcode");
    if (homeQrcodeContainer && typeof QRCode !== 'undefined') {
        new QRCode(homeQrcodeContainer, {
            text: "https://aftereffects-ok.github.io/SunriseBurger/",
            width: 100,
            height: 100,
            colorDark : "#ea580c",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    // 受取希望日時の設定 (現在時刻から30分後以降、15分刻み)
    const pickupTimeInput = document.getElementById('pickup-time');
    if (pickupTimeInput) {
        const updateMinPickupTime = () => {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30); // 30分後

            const minutes = now.getMinutes();
            const remainder = minutes % 15;
            if (remainder !== 0) {
                now.setMinutes(minutes + (15 - remainder)); // 15分単位に切り上げ
            }
            now.setSeconds(0, 0); // 秒・ミリ秒をリセット

            // YYYY-MM-DDTHH:mm 形式に変換 (ローカル時間)
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const mins = String(now.getMinutes()).padStart(2, '0');
            const minDateTime = `${year}-${month}-${day}T${hours}:${mins}`;

            pickupTimeInput.min = minDateTime;
            // pickupTimeInput.step = 900; // HTML側で設定済みのためJSでの設定は必須ではないが、動的に変更する場合に備えて残しても良い
        };

        updateMinPickupTime();
        // ページを開いたまま時間が経過した場合のために、フォーカス時にも更新
        pickupTimeInput.addEventListener('focus', updateMinPickupTime);

        // 手入力された場合も15分単位に丸める処理
        pickupTimeInput.addEventListener('change', function() {
            if (!this.value) return;
            
            const date = new Date(this.value);
            const minutes = date.getMinutes();
            
            if (minutes % 15 !== 0) {
                // 最寄りの15分単位に丸める（例: 12:07 -> 12:00, 12:08 -> 12:15）
                date.setMinutes(Math.round(minutes / 15) * 15);
                
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hours = String(date.getHours()).padStart(2, '0');
                const mins = String(date.getMinutes()).padStart(2, '0');
                this.value = `${year}-${month}-${day}T${hours}:${mins}`;
            }
        });
    }

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

    // アラートモーダルの要素取得
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const alertCloseBtn = document.getElementById('alert-close-btn');

    // アラート表示関数
    const showAlert = (message) => {
        if (alertModal && alertMessage) {
            alertMessage.textContent = message;
            alertModal.classList.remove('hidden');
            alertModal.classList.add('flex');
        } else {
            alert(message); // フォールバック
        }
    };

    if (alertCloseBtn) {
        alertCloseBtn.addEventListener('click', () => {
            alertModal.classList.add('hidden');
            alertModal.classList.remove('flex');
        });
    }

    // メニュー項目のチェックボックスと数量入力の連動
    // フォーム内のメニュー項目コンテナ（grid gap-3 の直下にある div）をすべて取得
    const menuItems = document.querySelectorAll('form .grid.gap-3 > div, form .grid.gap-3 > .bg-stone-50');

    menuItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const quantityInput = item.querySelector('input[type="number"]');
        const nextSibling = item.nextElementSibling;
        const detailsContainer = (nextSibling && nextSibling.classList.contains('set-details')) ? nextSibling.querySelector('.details-container') : null;
        const isPairSet = nextSibling && nextSibling.classList.contains('pair-set-details');

        // セットメニュー詳細の更新関数
        const updateSetDetails = () => {
            if (!detailsContainer) return;
            const quantity = parseInt(quantityInput.value) || 0;
            
            // 既存の選択状態を保存
            const currentSelections = [];
            const existingSelects = detailsContainer.querySelectorAll('select');
            existingSelects.forEach(select => {
                currentSelections.push(select.value);
            });

            detailsContainer.innerHTML = ''; // 既存の選択肢をクリア

            if (quantity > 0) {
                for (let i = 1; i <= quantity; i++) {
                    let setHtml = '';
                    if (isPairSet) {
                        // ペア・ディナーセットのHTMLを生成
                        setHtml = `
                            <div class="border-t border-stone-200 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                                <p class="font-bold text-sm text-stone-800 mb-2">ペアセット ${i}</p>
                                <div class="space-y-3">
                                    <div><label class="block text-xs font-bold text-stone-600 mb-1">バーガー1:</label><select class="w-full p-2 rounded border border-stone-200 text-sm pair-burger-1"><option value="">--選択--</option><option value="サンライズ・クラシック">サンライズ・クラシック</option><option value="アボカド・クリーンバーガー">アボカド・クリーンバーガー</option><option value="ダブル・グラビティ">ダブル・グラビティ</option><option value="奥沢ガーデンバーガー">奥沢ガーデンバーガー</option><option value="ブルーチーズ＆ハニー">ブルーチーズ＆ハニー</option><option value="スパイシー・サンライズ">スパイシー・サンライズ</option></select></div>
                                    <div><label class="block text-xs font-bold text-stone-600 mb-1">バーガー2:</label><select class="w-full p-2 rounded border border-stone-200 text-sm pair-burger-2"><option value="">--選択--</option><option value="サンライズ・クラシック">サンライズ・クラシック</option><option value="アボカド・クリーンバーガー">アボカド・クリーンバーガー</option><option value="ダブル・グラビティ">ダブル・グラビティ</option><option value="奥沢ガーデンバーガー">奥沢ガーデンバーガー</option><option value="ブルーチーズ＆ハニー">ブルーチーズ＆ハニー</option><option value="スパイシー・サンライズ">スパイシー・サンライズ</option></select></div>
                                    <div><label class="block text-xs font-bold text-stone-600 mb-1">サイド1:</label><select class="w-full p-2 rounded border border-stone-200 text-sm pair-side-1"><option value="">--選択--</option><option value="三種芋のフレンチフライ (S)">三種芋のフレンチフライ (S)</option><option value="三種芋のフレンチフライ (M)">三種芋のフレンチフライ (M)</option><option value="スモーキー・オニオンリング">スモーキー・オニオンリング</option><option value="地場野菜のミニサラダ">地場野菜のミニサラダ</option><option value="具だくさんクラムチャウダー">具だくさんクラムチャウダー</option></select></div>
                                    <div><label class="block text-xs font-bold text-stone-600 mb-1">サイド2:</label><select class="w-full p-2 rounded border border-stone-200 text-sm pair-side-2"><option value="">--選択--</option><option value="三種芋のフレンチフライ (S)">三種芋のフレンチフライ (S)</option><option value="三種芋のフレンチフライ (M)">三種芋のフレンチフライ (M)</option><option value="スモーキー・オニオンリング">スモーキー・オニオンリング</option><option value="地場野菜のミニサラダ">地場野菜のミニサラダ</option><option value="具だくさんクラムチャウダー">具だくさんクラムチャウダー</option></select></div>
                                    <div><label class="block text-xs font-bold text-stone-600 mb-1">ドリンク1:</label><select class="w-full p-2 rounded border border-stone-200 text-sm pair-drink-1"><option value="">--選択--</option><option value="自家製クラフトコーラ">自家製クラフトコーラ</option><option value="シーズナル・スムージー">シーズナル・スムージー</option><option value="オリジナルブレンドコーヒー">オリジナルブレンドコーヒー</option><option value="紅茶">紅茶</option><option value="キッズ・オレンジジュース">キッズ・オレンジジュース</option></select></div>
                                    <div><label class="block text-xs font-bold text-stone-600 mb-1">ドリンク2:</label><select class="w-full p-2 rounded border border-stone-200 text-sm pair-drink-2"><option value="">--選択--</option><option value="自家製クラフトコーラ">自家製クラフトコーラ</option><option value="シーズナル・スムージー">シーズナル・スムージー</option><option value="オリジナルブレンドコーヒー">オリジナルブレンドコーヒー</option><option value="紅茶">紅茶</option><option value="キッズ・オレンジジュース">キッズ・オレンジジュース</option></select></div>
                                </div>
                            </div>
                        `;
                    } else {
                        // 通常セットのドリンク選択HTMLを生成
                        setHtml = `
                            <div class="border-t border-stone-200 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                                <label class="block text-xs font-bold text-stone-600 mb-1">セット ${i} のドリンク:</label>
                                <select class="w-full p-2 rounded border border-stone-200 text-sm">
                                    <option value="">-- 選択してください --</option>
                                    <option value="自家製クラフトコーラ">自家製クラフトコーラ</option>
                                    <option value="シーズナル・スムージー">シーズナル・スムージー</option>
                                    <option value="オリジナルブレンドコーヒー">オリジナルブレンドコーヒー</option>
                                    <option value="紅茶">紅茶</option>
                                    <option value="キッズ・オレンジジュース">キッズ・オレンジジュース</option>
                                </select>
                            </div>
                        `;
                    }
                    detailsContainer.insertAdjacentHTML('beforeend', setHtml);
                }

                // 保存した選択状態を復元
                const newSelects = detailsContainer.querySelectorAll('select');
                newSelects.forEach((select, index) => {
                    if (index < currentSelections.length) {
                        select.value = currentSelections[index];
                    }
                });
            }
        };

        if (checkbox && quantityInput) {

            // チェックボックスで詳細欄の表示/非表示を切り替え
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    if (!quantityInput.value || parseInt(quantityInput.value) === 0) {
                        quantityInput.value = 1;
                    }
                    if (detailsContainer) {
                        nextSibling.classList.remove('hidden');
                        updateSetDetails();
                    }
                } else {
                    quantityInput.value = '';
                    if (detailsContainer) {
                        nextSibling.classList.add('hidden');
                        detailsContainer.innerHTML = '';
                    }
                }
            });

            // 数量に応じて選択肢を動的に生成
            quantityInput.addEventListener('input', function() {
                const val = parseInt(this.value);
                checkbox.checked = (val > 0);
                
                if (val > 0) {
                    if (detailsContainer) {
                        nextSibling.classList.remove('hidden');
                        updateSetDetails();
                    }
                } else {
                    if (detailsContainer) {
                        nextSibling.classList.add('hidden');
                        detailsContainer.innerHTML = '';
                    }
                }
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
            
            const iconContainer = document.getElementById('confirmation-icon-container');
            const icon = document.getElementById('confirmation-icon');

            // ボタンの状態変更
            const originalText = confirmBtn.textContent;
            confirmBtn.disabled = true;
            confirmBtn.textContent = '送信中...';
            if(icon) icon.classList.add('animate-bounce');

            // 1. 注文データを送信
            fetch(SCRIPT_URL_ORDER, {
                method: 'POST',
                body: JSON.stringify(pendingFormData)
            })
            .then(res => res.json())
            .then(orderData => {
                console.log('GAS Order Response:', orderData);
                // 2. 注文データの送信が成功したら、次に注文詳細データを送信
                return fetch(SCRIPT_URL_DETAIL, {
                    method: 'POST',
                    body: JSON.stringify(pendingFormData)
                });
            })
            .then(res => res.json())
            .then(detailData => {
                console.log('GAS Detail Response:', detailData);
                
                // 両方の送信が成功したらモーダルを閉じて完了画面を表示
                closeModal();
                openCompletionModal(pendingFormData.id);
            })
            .catch(err => {
                showAlert('送信に失敗しました: ' + err);
            })
            .finally(() => {
                confirmBtn.disabled = false;
                confirmBtn.textContent = originalText;
                if(icon) icon.classList.remove('animate-bounce');
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
            let isValid = true;
            let totalBurgerCount = 0;
            let totalRestrictedSetCount = 0;

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
                        let subtotal = price * quantity;

                        // ハンバーガーとセットメニューのチェック
                        if (item.closest('#burgers-section')) {
                            // ハンバーガーセクション内のアイテムで、かつチェックが入っているものをカウント
                            if (checkbox.checked) totalBurgerCount += quantity;
                        }
                        if (item.closest('#set-menu-section') && name !== 'ペア・ディナーセット') {
                            // セットメニュー（制限対象）で、かつチェックが入っているものをカウント
                            if (checkbox.checked) totalRestrictedSetCount += quantity;
                        }

                        const newItem = { name, price, quantity, subtotal };

                        // セットメニューの選択内容を取得
                        const nextSibling = item.nextElementSibling;
                        if (nextSibling && nextSibling.classList.contains('set-details')) {
                            const detailsContainer = nextSibling.querySelector('.details-container');
                            const selectionGroups = detailsContainer ? detailsContainer.children : [];

                            if (nextSibling.classList.contains('pair-set-details')) {
                                // ペア・ディナーセット
                                newItem.selections = [];
                                for (let i = 0; i < selectionGroups.length; i++) {
                                    const group = selectionGroups[i];
                                    const selections = {
                                        burger1: group.querySelector('.pair-burger-1').value,
                                        burger2: group.querySelector('.pair-burger-2').value,
                                        side1: group.querySelector('.pair-side-1').value,
                                        side2: group.querySelector('.pair-side-2').value,
                                        drink1: group.querySelector('.pair-drink-1').value,
                                        drink2: group.querySelector('.pair-drink-2').value,
                                    };
                                    if (Object.values(selections).some(val => val === '')) {
                                        if (isValid) showAlert(`ペアセット ${i + 1} のすべての項目を選択してください。`);
                                        isValid = false;
                                    }
                                    newItem.selections.push(selections);
                                }
                            } else {
                                // 通常のセット
                                newItem.drinks = [];
                                const drinkSelects = detailsContainer.querySelectorAll('select');
                                for (let i = 0; i < drinkSelects.length; i++) {
                                    const select = drinkSelects[i];
                                    if (select.value === '') {
                                        if (isValid) showAlert(`「${name}」セット ${i + 1} のドリンクを選択してください。`);
                                        isValid = false;
                                    }
                                    newItem.drinks.push(select.value);
                                }
                            }
                        }

                        orderItems.push(newItem);
                        totalAmount += subtotal;
                    }
                }
            });

            if (totalRestrictedSetCount > totalBurgerCount) {
                if (isValid) showAlert(`セットメニュー（ペア・ディナーセットを除く）は、ハンバーガーの注文数（${totalBurgerCount}個）までしか注文できません。\n現在のセットメニュー注文数: ${totalRestrictedSetCount}個`);
                isValid = false;
            }

            if (!isValid) {
                return; // バリデーションエラーがあればここで処理を中断
            }

            if (orderItems.length === 0) {
                showAlert('注文するメニューを選択してください。');
                return;
            }

            // 送信データの作成
            const now = new Date();
            const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            const orderDetailsText = orderItems.map(item => {
                if (item.selections) {
                    const setsText = item.selections.map((s, index) => 
                        `  [セット ${index + 1}] バーガー: ${s.burger1}, ${s.burger2} / サイド: ${s.side1}, ${s.side2} / ドリンク: ${s.drink1}, ${s.drink2}`
                    ).join('\n');
                    return `${item.name} x${item.quantity}\n${setsText}`;
                }
                if (item.drinks) {
                    const drinksText = item.drinks.map((drink, index) => `  [セット ${index + 1}] ドリンク: ${drink}`).join('\n');
                    return `${item.name} x${item.quantity}\n${drinksText}`;
                }
                return `${item.name} x${item.quantity}`;
            }).join('\n');

            pendingFormData = {
                id: 'ORD-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase(), // AppSheet用のユニークID
                timestamp: timestamp, // 注文日時
                name: document.getElementById('name').value,
                phone: "'" + document.getElementById('phone').value,
                email: document.getElementById('email').value,
                pickupTime: document.getElementById('pickup-time').value,
                orderDetails: orderDetailsText,
                totalAmount: totalAmount,
                notes: document.getElementById('notes').value,
                items: orderItems.flatMap((item) => {
                    const expandedItems = [];
                    
                    const addItem = (name, price, qty, isSetItem) => {
                        expandedItems.push({
                            detailId: generateUniqueId(),
                            name: name,
                            price: price,
                            quantity: qty,
                            subtotal: price * qty,
                            isSetItem: isSetItem,
                            orderStatus: 'オーダー'
                        });
                    };

                    if (item.name === 'スタンダードセット') {
                        if (item.drinks) {
                            item.drinks.forEach(drink => {
                                // セット価格を最初のアイテムに割り当て、他は0円
                                addItem('三種芋のフレンチフライ (S)', item.price, 1, true);
                                addItem(drink, 0, 1, true);
                            });
                        }
                    } else if (item.name === 'サラダ＆スープセット') {
                        for (let i = 0; i < item.quantity; i++) {
                            addItem('地場野菜のミニサラダ', item.price, 1, true);
                            addItem('本日の日替わりスープ', 0, 1, true);
                        }
                    } else if (item.name === 'サンライズ・フルコース') {
                        if (item.drinks) {
                            item.drinks.forEach(drink => {
                                addItem('三種芋のフレンチフライ (S)', item.price, 1, true);
                                addItem(drink, 0, 1, true);
                                addItem('自家製ミニデザート', 0, 1, true);
                            });
                        }
                    } else if (item.name === 'ランチタイム限定セット') {
                        if (item.drinks) {
                            item.drinks.forEach(drink => {
                                addItem('三種芋のフレンチフライ (S)', item.price, 1, true);
                                addItem(drink, 0, 1, true);
                            });
                        }
                    } else if (item.name === 'ペア・ディナーセット') {
                        if (item.selections) {
                            item.selections.forEach(sel => {
                                // ペアセット価格を最初のアイテムに割り当て
                                addItem(sel.burger1, item.price, 1, true);
                                addItem(sel.burger2, 0, 1, true);
                                addItem(sel.side1, 0, 1, true);
                                addItem(sel.side2, 0, 1, true);
                                addItem(sel.drink1, 0, 1, true);
                                addItem(sel.drink2, 0, 1, true);
                            });
                        }
                    } else {
                        // 単品商品
                        addItem(item.name, item.price, item.quantity, false);
                    }
                    return expandedItems;
                })
            };

            // モーダルに内容を表示
            if (modalItems && modalTotal) {
                modalItems.innerHTML = orderItems.map(item => {
                    let detailHTML = '';
                    if (item.selections) {
                        detailHTML = item.selections.map((s, index) => 
                            `<div class="pl-4 text-xs text-stone-500">
                                <p class="font-semibold">[セット ${index + 1}]</p>
                                <p>バーガー: ${s.burger1}, ${s.burger2}</p>
                                <p>サイド: ${s.side1}, ${s.side2}</p>
                                <p>ドリンク: ${s.drink1}, ${s.drink2}</p>
                            </div>`
                        ).join('');
                    } else if (item.drinks) {
                        detailHTML = item.drinks.map((drink, index) => 
                            `<div class="pl-4 text-xs text-stone-500">
                                <p>[セット ${index + 1}] ドリンク: ${drink}</p>
                            </div>`
                        ).join('');
                    }
                    return `<div class="py-1 border-b border-stone-100 last:border-0">
                        <div class="flex justify-between">
                            <span class="text-stone-700">${item.name} × ${item.quantity}</span>
                            <span class="font-bold text-stone-900">¥${item.subtotal.toLocaleString()}</span>
                        </div>
                        ${detailHTML}
                    </div>`;
                }).join('');
                modalTotal.textContent = `¥${totalAmount.toLocaleString()}`;
                
                openModal();
            }
        });
    }
});