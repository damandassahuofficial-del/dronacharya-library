"use client";
import React, { useState } from "react";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwRytE8gk3RWkY653YxcZ-pqKm7zLLosLdW4oyxNBbBzlPmHQhccyiAvWwbSnv8JLB-/exec";

export default function AdmissionForm() {
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    gender: "पुरुष",
    dob: "",
    phone: "",
    altPhone: "",
    course: "",
    exam: "",
    address: "",
    pincode: "",
    idProof: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert("कृपया नियम एवं शर्तों की घोषणा पर टिक (Agree) करें।");
      return;
    }

    try {
      setSubmitting(true);
      const cleanAadhaar = formData.idProof ? formData.idProof.replace(/\D/g, "").slice(-4) : "";
      const fullAadhaar = cleanAadhaar ? `XXXX-XXXX-${cleanAadhaar}` : "-";

      const formBody = new URLSearchParams();
      formBody.append("action", "public_admission");
      formBody.append("name", formData.name.trim().toUpperCase());
      formBody.append("fatherName", formData.fatherName.trim().toUpperCase());
      formBody.append("gender", formData.gender);
      formBody.append("dob", formData.dob);
      formBody.append("phone", formData.phone.trim());
      formBody.append("altPhone", formData.altPhone.trim());
      formBody.append("course", formData.course.trim().toUpperCase());
      formBody.append("exam", formData.exam.trim().toUpperCase());
      formBody.append("address", formData.address.trim().toUpperCase());
      formBody.append("pincode", formData.pincode.trim());
      formBody.append("idProof", fullAadhaar);

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      setSubmitted(true);
    } catch (err) {
      alert("आवेदन जमा करने में समस्या आई, कृपया दोबारा प्रयास करें।");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f1eee7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-[#dcd4c0] space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <h2 className="text-2xl font-black text-neutral-900">आवेदन सफलतापूर्वक जमा हुआ!</h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            आपका आवेदन द्रोणाचार्य लाइब्रेरी प्रबंधन को प्राप्त हो गया है। कृपया काउंटर पर संपर्क करके अपनी सीट एवं रसीद प्राप्त करें।
          </p>
          <div className="pt-2 text-neutral-400 text-[11px] font-semibold">
            द्रोणाचार्य लाइब्रेरी • Contact: 8461929686
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1eee7] py-6 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white border border-[#dcd4c0] rounded-2xl shadow-xl overflow-hidden font-sans">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 text-center space-y-1">
          <div className="inline-block p-2 bg-white/10 rounded-full mb-1 text-2xl">📚</div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">द्रोणाचार्य लाइब्रेरी</h1>
          <p className="text-xs sm:text-sm font-semibold tracking-wider text-amber-200 uppercase">
            सदस्यता आवेदन पत्र (ADMISSION FORM)
          </p>
          <p className="text-[11px] text-blue-100 italic">"Where Dedicated Students Turn Dreams into Result"</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs text-neutral-800">
          {/* Section: Personal Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-900 border-b pb-1.5 flex items-center gap-2">
              <span>👤</span> व्यक्तिगत जानकारी (PERSONAL INFORMATION)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">नाम (Full Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="पूरा नाम दर्ज करें"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 uppercase font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">पिता का नाम (Father's Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="पिता का नाम"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 uppercase font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block font-bold mb-1">जन्म तिथि (Date of Birth) *</label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold mb-1.5">लिंग (Gender)</label>
                <div className="flex items-center gap-4 pt-1 font-semibold">
                  {["पुरुष", "महिला", "अन्य"].map((g) => (
                    <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={formData.gender === g}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="accent-blue-600"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">मोबाइल नंबर (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10 अंकों का मोबाइल नंबर"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">अभिभावक का मोबाइल नंबर (Parents Contact)</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="अभिभावक का मोबाइल नंबर"
                  value={formData.altPhone}
                  onChange={(e) => setFormData({ ...formData, altPhone: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">कक्षा / कोर्स (Class / Course)</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech, B.Sc, BA, 12th"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 uppercase focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">परीक्षा की तैयारी (Exam Preparation)</label>
                <input
                  type="text"
                  placeholder="e.g. UPSC, CGPSC, SSC, Railway, NEET"
                  value={formData.exam}
                  onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 uppercase focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-1">वर्तमान पता (Current Address) *</label>
              <textarea
                required
                rows={2}
                placeholder="मकान नंबर, वार्ड, शहर/गांव का नाम"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 uppercase focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold mb-1">पिनकोड (Pincode) *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="6 डिजिट पिनकोड"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">आधार नंबर (Last 4 Digits) *</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="आधार के अंतिम 4 अंक (e.g. 5678)"
                  value={formData.idProof}
                  onChange={(e) => setFormData({ ...formData, idProof: e.target.value })}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Section: Rules & Instructions */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
            <h4 className="font-black text-amber-950 flex items-center gap-1.5">
              <span>📜</span> नियम एवं शर्तें (RULES & CONDITIONS)
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 leading-relaxed">
              <li>लाइब्रेरी में शांति एवं अनुशासन बनाए रखना प्रत्येक सदस्य की जिम्मेदारी होगी।</li>
              <li>लाइब्रेरी परिसर में किसी भी प्रकार का शोर-शराबा, विवाद या अनुचित व्यवहार वर्जित है।</li>
              <li>लाइब्रेरी की सीट किसी अन्य सदस्य को हस्तांतरित नहीं की जा सकती।</li>
              <li>शुल्क किसी भी परिस्थिति में वापस (Refund) नहीं किया जाएगा।</li>
              <li>मोबाइल फोन Silent Mode पर रखें और कॉल केवल बाहर जाकर करें।</li>
              <li>धूम्रपान, शराब तथा अन्य नशीले पदार्थ पूर्णतः प्रतिबंधित हैं।</li>
            </ol>

            <div className="pt-2 border-t border-amber-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-700 rounded"
                />
                <span className="text-xs font-bold text-neutral-900 leading-tight">
                  घोषणा (Declaration): मैं घोषणा करता/करती हूँ कि मेरे द्वारा दी गई सभी जानकारी सत्य है तथा मैंने लाइब्रेरी के सभी नियमों एवं शर्तों को ध्यानपूर्वक पढ़ा है और उनका पालन करने के लिए सहमत हूँ।
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-black text-sm rounded-xl shadow-lg transition disabled:bg-neutral-400"
          >
            {submitting ? "जमा हो रहा है..." : "आवेदन पत्र जमा करें (SUBMIT ADMISSION FORM)"}
          </button>
        </form>
      </div>
    </div>
  );
}