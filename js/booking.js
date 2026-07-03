/* booking.js — global functions accessible via HTML onclick */

let step = 1, mType = 1;

/* ── Open/Close ── */
function openModal(e) {
  if (e) e.preventDefault();
  document.getElementById('bModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  goStep(1);
}

function closeModal() {
  document.getElementById('bModal').classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('bModal')?.addEventListener('click', e => {
  if (e.target.id === 'bModal') closeModal();
});

document.getElementById('serviceModal')?.addEventListener('click', e => {
  if (e.target.id === 'serviceModal') closeServiceModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeServiceModal();
  }
});

/* ── Steps ── */
function goStep(n) {
  step = n;
  ['mStep1','mStep2','mStep3','mStep4'].forEach((id,i) => {
    const el = document.getElementById(id);
    if (el) el.style.display = i+1 === n ? 'block' : 'none';
  });
  ['ms1','ms2','ms3','ms4'].forEach((id,i) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', i+1 === n);
    el.classList.toggle('done',   i+1 < n);
  });
}

/* ── Validation ── */
function validateStep1() {
  const n = document.getElementById('bN')?.value.trim();
  const p = document.getElementById('bP')?.value.trim();
  if (!n || !p) {
    showErr('يرجى إدخال الاسم ورقم الجوال على الأقل.');
    return false;
  }
  return true;
}

function showErr(msg) {
  document.querySelector('.modal-err')?.remove();
  const d = document.createElement('div');
  d.className = 'modal-err';
  d.style.cssText = 'background:rgba(200,50,50,0.08);border:1px solid rgba(200,50,50,0.2);border-radius:6px;padding:10px 14px;margin-bottom:14px;color:#c43;font-family:var(--font-ui);font-size:0.85rem;';
  d.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="margin-left:6px;"></i>${msg}`;
  const s1 = document.getElementById('mStep1');
  if (s1) s1.insertBefore(d, s1.firstChild);
  setTimeout(() => d.remove(), 3500);
}

/* ── Modal type ── */
function selMType(n) {
  mType = n;
  ['mb1','mb2','mb3'].forEach((id,i) => {
    document.getElementById(id)?.classList.toggle('sel', i+1 === n);
  });
}

/* ── Submit ── */
async function submitBook(method = 'unpaid', sender = '', receipt = '') {
  const u = getCurrentUser();
  const types = ['عبر الواتساب (150 ر.س)','هاتفية (250 ر.س)','اجتماع مرئي (400 ر.س)'];
  const pricing = [150, 250, 400];
  const amount = pricing[mType - 1] || 250;
  
  const data = {
    name:    document.getElementById('bN')?.value,
    phone:   document.getElementById('bP')?.value,
    email:   document.getElementById('bE')?.value,
    desc:    document.getElementById('bD')?.value,
    type:    types[mType - 1] || 'غير محدد',
    service: document.getElementById('bS')?.value,
    time:    document.getElementById('bT')?.value,
    payment_status: method !== 'unpaid' ? 'paid' : 'unpaid',
    payment_method: method,
    amount: amount,
    sender_name: sender,
    receipt_base64: receipt
  };

  let success = true;

  // 1. Try to save booking data to Supabase
  if (window.supabaseClient) {
    try {
      const { error } = await window.supabaseClient
        .from('bookings')
        .insert([{
          user_id:        u ? u.id : null,
          name:           data.name,
          phone:          data.phone,
          email:          data.email,
          description:    data.desc,
          type:           data.type,
          service:        data.service,
          preferred_time: data.time,
          payment_status: data.payment_status,
          payment_method: data.payment_method,
          amount:         data.amount,
          sender_name:    data.sender_name,
          receipt_base64: data.receipt_base64
        }]);

      if (error) {
        console.error('Error saving booking to Supabase (falling back to local):', error.message);
      } else {
        console.log('Booking successfully saved to Supabase database!');
      }
    } catch (err) {
      console.error('Network error saving booking to Supabase:', err);
      success = false;
    }
  }

  // 2. Backup in localStorage
  const saved = JSON.parse(localStorage.getItem('lf_bookings') || '[]');
  saved.push(data);
  localStorage.setItem('lf_bookings', JSON.stringify(saved));

  // 3. Build WhatsApp message redirect
  const isBank = method === 'bank_transfer';
  const msg = encodeURIComponent(
    `مرحباً، أود تأكيد موعد الاستشارة بعد التحويل البنكي.\n` +
    `الاسم: ${data.name}\nالجوال: ${data.phone}\n` +
    `النوع: ${data.type}\nالخدمة: ${data.service || 'غير محدد'}\nالوقت: ${data.time}\n` +
    `طريقة الدفع: ${isBank ? 'تحويل بنكي (الراجحي)' : data.payment_method}\n` +
    `اسم المحوِّل: ${isBank ? data.sender_name : '—'}\n` +
    `الحالة: بانتظار تأكيد الإيصال (${data.amount} ريال)\n` +
    `التفاصيل: ${data.desc || 'لا يوجد'}`
  );

  const waBtn = document.querySelector('#mStep4 a[href*="wa.me"]');
  if (waBtn) waBtn.href = `https://wa.me/966566989610?text=${msg}`;

  return success;
}

/* ── Service Details Modal Logic ── */
const serviceDetails = {
  commercial: {
    title: "القضايا التجارية",
    icon: "fa-briefcase",
    desc: "نقدّم خدمات قانونية متكاملة للشركات والمؤسسات التجارية لحماية استثماراتها وتنظيم علاقاتها التعاقدية وحوكمة ممارساتها وفق نظام الشركات الجديد واللوائح المعمول بها في المملكة العربية السعودية.",
    list: ["تأسيس الشركات بجميع أنواعها وصياغة لوائحها الداخلية وعقود التأسيس.", "صياغة ومراجعة العقود والاتفاقيات التجارية ومحاضر مجالس الإدارة.", "التمثيل القضائي والرفع والترافع في المنازعات والنزاعات التجارية.", "التحكيم والتسوية الودية للخلافات التجارية بين الشركاء أو الشركات.", "التأكد من الامتثال الكامل للأنظمة واللوائح وتقديم الاستشارات الاستباقية للمستثمرين."]
  },
  civil: {
    title: "القضايا المدنية",
    icon: "fa-scale-balanced",
    desc: "نتولى الترافع والدفاع في كافة المنازعات المدنية المتعلقة بالحقوق والالتزامات المالية والتعاقدية للأفراد والشركات أمام المحاكم المدنية العامة ومحاكم التنفيذ.",
    list: ["تحصيل الديون والمطالبات المالية بموجب السندات والعقود الموثقة.", "دعاوى التعويض عن الأضرار المادية والمعنوية الناشئة عن التقصير أو الإخلال بالعقود.", "إجراءات تنفيذ الأحكام القضائية والأوراق التجارية (الشيكات، السندات لأمر).", "صياغة المذكرات القانونية والوائح الاعتراضية وتمثيل الموكلين أمام جهات التقاضي."]
  },
  family: {
    title: "الأحوال الشخصية",
    icon: "fa-users",
    desc: "نقدّم الرعاية القانونية اللازمة في قضايا الأحوال الشخصية بخصوصية وسرية تامة، حرصاً منا على استقرار الأسر وتطبيق الأحكام الشرعية بدقة.",
    list: ["دعاوى الطلاق والخلع وفسخ النكاح وإثبات العلاقات الزوجية.", "تنظيم النفقة والحضانة وحق الزيارة والولاية الشرعية للأبناء.", "تقسيم وحصر التركات وتوزيع المواريث وتصفية الأموال وتوثيق الوقائع.", "صياغة لوائح الأوقاف والوصايا وحمايتها وإدارتها شرعياً وقانونياً."]
  },
  labor: {
    title: "القضايا العمالية",
    icon: "fa-id-badge",
    desc: "نقدّم الدعم والاستشارات القانونية في صياغة عقود العمل وحل الخلافات العمالية بين الشركات والموظفين بما يتوافق مع نظام العمل السعودي.",
    list: ["المطالبة بمستحقات نهاية الخدمة، الرواتب المتأخرة، ورصيد الإجازات.", "دعاوى الفصل التعسفي والتعويض عن الإنهاء غير المشروع لعقد العمل.", "صياغة لوائح العمل الداخلية وتحديثها وتسجيلها في المنصات الرسمية.", "تسوية النزاعات العمالية ودياً أو الترافع أمام المحاكم العمالية ولجان التسوية."]
  },
  criminal: {
    title: "القضايا الجنائية",
    icon: "fa-gavel",
    desc: "تمثيل ودفاع قانوني قوي في القضايا الجنائية بمختلف أنواعها لضمان سير العدالة وحماية الحقوق والحريات وفق الأنظمة القضائية والجزائية السعودية.",
    list: ["الترافع الجنائي والدفاع أمام النيابة العامة والمحاكم الجزائية في القضايا بمختلف تصنيفاتها.", "صياغة مذكرات الدفاع، اللوائح الاعتراضية، وطلب الاستئناف أو النقض.", "الاستشارات الجنائية المتخصصة لتفادي شبهات الجرائم المعلوماتية أو المالية.", "مرافقة الموكلين وحضور التحقيقات الرسمية لضمان الامتثال للضمانات القضائية."]
  },
  estate: {
    title: "العقارات",
    icon: "fa-building",
    desc: "نقدّم استشارات وخدمات قانونية متكاملة لضمان سلامة التعاملات العقارية من بيع وشراء وتطوير، وحل النزاعات العقارية والملكية.",
    list: ["فحص الصكوك وتوثيق العقود العقارية وضمان سلامتها القانونية.", "الترافع في نزاعات الملكية العقارية والحدود وتداخل الأراضي.", "تمثيل المطورين العقاريين وصياغة عقود التطوير والمقاولات والبيع على الخارطة.", "النزاعات الإيجارية السكنية والتجارية أمام اللجان والمنصات الرسمية."]
  },
  ip: {
    title: "الملكية الفكرية",
    icon: "fa-lightbulb",
    desc: "حماية وحفظ حقوق المبتكرين والشركات لضمان حماية أصولهم الفكرية من براءات اختراع وعلامات تجارية ومصنفات أدبية من السرقة والتعدي.",
    list: ["تسجيل العلامات التجارية وحمايتها من التقليد والاستغلال غير المشروع.", "حفظ حقوق المؤلف والمصنفات الأدبية والفنية والبرمجيات الخاصة.", "إجراءات تسجيل براءات الاختراع والابتكارات الصناعية لدى الجهات المختصة.", "الترافع أمام المحاكم المختصة ضد حالات التعدي وسرقة الأصول الفكرية."]
  },
  consulting: {
    title: "الاستشارات القانونية",
    icon: "fa-comments",
    desc: "تقديم استشارات قانونية سريعة ودقيقة للأفراد والشركات في كافة فروع الأنظمة لمساعدتهم على اتخاذ القرارات الصحيحة وتفادي المخاطر.",
    list: ["الاستشارات القانونية الشفهية والكتابية الموثقة بآراء قانونية مسببة.", "مراجعة وتدقيق العقود والاتفاقيات وصياغتها وتحديد مكامن الخطورة فيها.", "إعداد اللوائح التنظيمية الداخلية للشركات وتحديث السياسات المتبعة.", "تقديم الاستشارات الاستباقية في القوانين والأنظمة السعودية المستحدثة."]
  }
};

function showServiceDetails(key) {
  const data = serviceDetails[key];
  if (!data) return;

  document.getElementById('svcModalTitle').innerText = data.title;
  document.getElementById('svcModalDesc').innerText = data.desc;
  
  // Icon
  const iconWrap = document.getElementById('svcModalIcon');
  if (iconWrap) {
    iconWrap.innerHTML = `<i class="fa-solid ${data.icon}"></i>`;
  }
  
  // List
  const listContainer = document.getElementById('svcModalList');
  if (listContainer) {
    listContainer.innerHTML = '';
    data.list.forEach(item => {
      const li = document.createElement('li');
      li.style.marginBottom = '12px';
      li.style.display = 'flex';
      li.style.alignItems = 'flex-start';
      li.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--gold-mid);margin-left:10px;margin-top:4px;font-size:0.95rem;flex-shrink:0;"></i><span style="font-family:var(--font-body);font-size:0.96rem;line-height:1.5;">${item}</span>`;
      listContainer.appendChild(li);
    });
  }

  // Auto-select in booking dropdown
  const selectBox = document.getElementById('bS');
  if (selectBox) {
    for (let i = 0; i < selectBox.options.length; i++) {
      if (selectBox.options[i].text.includes(data.title)) {
        selectBox.selectedIndex = i;
        break;
      }
    }
  }

  // Open modal
  const modal = document.getElementById('serviceModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeServiceModal() {
  const modal = document.getElementById('serviceModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function bookThisService() {
  closeServiceModal();
  setTimeout(() => {
    if (typeof guardedOpenModal === 'function') {
      guardedOpenModal();
    } else {
      openModal();
    }
  }, 320);
}


/* ── Payment Checkout Logic ── */
let paymentMethod = 'mada';

function validateStep2() {
  const service = document.getElementById('bS')?.value;
  if (!service || service.includes('اختر')) {
    alert('يرجى اختيار مجال الخدمة المطلوبة للمتابعة.');
    return false;
  }
  return true;
}

function updatePaymentDetails() {
  const pricing = [150, 250, 400];
  const amount = pricing[mType - 1] || 250;
  
  const amtEl = document.getElementById('payment-amount');
  if (amtEl) amtEl.textContent = amount;

  const apPrice = document.getElementById('applepay-price');
  if (apPrice) apPrice.textContent = amount + '.00';
}

function selPaymentMethod(method) {
  paymentMethod = method;
  
  // Toggle tab active state
  ['pm1', 'pm2', 'pm3'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (!el) return;
    const isSel = (i === 0 && method === 'mada') || 
                  (i === 1 && method === 'visa') || 
                  (i === 2 && method === 'applepay');
    el.classList.toggle('sel', isSel);
    el.style.borderColor = isSel ? 'var(--gold)' : 'var(--border-soft)';
  });

  // Toggle input blocks
  const cardFields = document.getElementById('card-fields');
  const appleFields = document.getElementById('applepay-fields');
  const payBtn = document.getElementById('paySubmitBtn');

  if (method === 'applepay') {
    if (cardFields) cardFields.style.display = 'none';
    if (appleFields) appleFields.style.display = 'block';
    if (payBtn) payBtn.style.display = 'none';
  } else {
    if (cardFields) cardFields.style.display = 'block';
    if (appleFields) appleFields.style.display = 'none';
    if (payBtn) payBtn.style.display = 'block';
  }
}

// Format credit card inputs
document.getElementById('cardNumber')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  let matches = v.match(/\d{4,16}/g);
  let match = matches && matches[0] || '';
  let parts = [];
  for (let i=0, len=match.length; i<len; i+=4) {
    parts.push(match.substring(i, i+4));
  }
  e.target.value = parts.length > 0 ? parts.join(' ') : v;
});

document.getElementById('cardExpiry')?.addEventListener('input', e => {
  let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
  if (v.length >= 2) {
    e.target.value = v.substring(0, 2) + '/' + v.substring(2, 4);
  } else {
    e.target.value = v;
  }
});

function validateCardDetails() {
  const name = document.getElementById('cardName')?.value.trim();
  const num = document.getElementById('cardNumber')?.value.replace(/\s+/g, '');
  const exp = document.getElementById('cardExpiry')?.value.trim();
  const cvv = document.getElementById('cardCvv')?.value.trim();

  if (!name || !num || !exp || !cvv) {
    alert('يرجى تعبئة كافة بيانات الدفع المطلوبة.');
    return false;
  }
  if (num.length < 16) {
    alert('يرجى التحقق من صحة رقم البطاقة.');
    return false;
  }
  if (!exp.includes('/') || exp.length < 5) {
    alert('يرجى التحقق من تاريخ انتهاء البطاقة.');
    return false;
  }
  if (cvv.length < 3) {
    alert('يرجى التحقق من رمز CVV خلف البطاقة.');
    return false;
  }
  return true;
}

async function processMockPayment() {
  if (!validateCardDetails()) return;

  const btn = document.getElementById('paySubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الاتصال بالبنك المصدر...';

  // Simulate bank authentication delay
  setTimeout(async () => {
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري خصم المبلغ وتأكيد العملية...';
    setTimeout(async () => {
      // Complete booking submission
      const success = await submitBook(paymentMethod);
      if (success) {
        goStep(4);
      } else {
        alert('حدث خطأ أثناء معالجة الحجز، يرجى المحاولة لاحقاً.');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> تأكيد الحجز والدفع';
      }
    }, 1500);
  }, 1500);
}

function triggerApplePaySim() {
  const sheet = document.getElementById('applePaySheet');
  const backdrop = document.getElementById('applePayBackdrop');
  if (sheet && backdrop) {
    sheet.style.transform = 'translateY(0)';
    backdrop.style.opacity = '1';
    backdrop.style.pointerEvents = 'all';

    // Simulate Face ID activation & double-click or automatic verify after 1.5s
    const status = document.getElementById('faceid-status');
    const icon = document.getElementById('faceid-icon');
    
    // Reset initial icons
    if (icon) {
      icon.className = 'fa-solid fa-face-id';
      icon.style.color = '#0a84ff';
      icon.parentNode.style.borderColor = '#0a84ff';
    }
    if (status) status.textContent = 'Double Click to Pay';
    
    setTimeout(() => {
      if (status) status.textContent = 'Processing Face ID...';
      setTimeout(async () => {
        if (icon) {
          icon.className = 'fa-solid fa-circle-check';
          icon.style.color = '#3dba6f';
          icon.parentNode.style.borderColor = '#3dba6f';
        }
        if (status) status.textContent = 'Payment Completed Successfully!';
        
        setTimeout(async () => {
          closeApplePaySim();
          const success = await submitBook('applepay');
          if (success) {
            goStep(4);
          }
        }, 1200);
      }, 1500);
    }, 1000);
  }
}

function closeApplePaySim() {
  const sheet = document.getElementById('applePaySheet');
  const backdrop = document.getElementById('applePayBackdrop');
  if (sheet && backdrop) {
    sheet.style.transform = 'translateY(100%)';
    backdrop.style.opacity = '0';
    backdrop.style.pointerEvents = 'none';
  }
}


/* ── Al Rajhi Bank Transfer Helpers ── */
let receiptBase64 = '';

function handleReceiptFileSelect(input) {
  const file = input.files[0];
  const statusText = document.getElementById('upload-status-text');
  const uploadArea = document.getElementById('receipt-upload-area');
  
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      alert('حجم الملف كبير جداً! يرجى إرفاق صورة بحجم أقل من 2 ميجابايت.');
      input.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      receiptBase64 = e.target.result;
      if (statusText) statusText.innerHTML = `<i class="fa-solid fa-file-image" style="color:var(--gold-mid);margin-left:4px;"></i> تم اختيار: <strong>${file.name}</strong>`;
      if (uploadArea) uploadArea.style.borderColor = 'var(--gold)';
    };
    reader.readAsDataURL(file);
  }
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ';
    btn.style.background = 'rgba(255,255,255,0.15)';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = 'none';
    }, 1500);
  });
}

async function processBankPayment() {
  const sender = document.getElementById('senderName')?.value.trim();
  if (!sender) {
    alert('يرجى كتابة اسم المحوِّل لتأكيد الطلب.');
    return;
  }
  if (!receiptBase64) {
    alert('يرجى إرفاق صورة إيصال التحويل لإثبات الدفع.');
    return;
  }

  const btn = document.getElementById('paySubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري حفظ البيانات وإرسال الموعد...';

  // Submit booking to Supabase
  const success = await submitBook('bank_transfer', sender, receiptBase64);
  if (success) {
    goStep(4);
  } else {
    alert('حدث خطأ أثناء معالجة الحجز، يرجى المحاولة لاحقاً.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> تأكيد الحجز وإرسال الإيصال';
  }
}

/* ── Expose to global scope for inline onclick handlers ── */
window.showServiceDetails  = showServiceDetails;
window.closeServiceModal   = closeServiceModal;
window.bookThisService     = bookThisService;
window.openModal           = openModal;
window.closeModal          = closeModal;
window.goStep              = goStep;
window.selMType            = selMType;
window.submitBook          = submitBook;
window.validateStep1       = validateStep1;
window.validateStep2       = validateStep2;
window.updatePaymentDetails = updatePaymentDetails;
window.selPaymentMethod    = selPaymentMethod;
window.processMockPayment  = processMockPayment;
window.triggerApplePaySim  = triggerApplePaySim;
window.closeApplePaySim    = closeApplePaySim;
window.handleReceiptFileSelect = handleReceiptFileSelect;
window.copyToClipboard     = copyToClipboard;
window.processBankPayment  = processBankPayment;


