"use client";
import React, { useState, useRef, useEffect } from "react";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwRytE8gk3RWkY653YxcZ-pqKm7zLLosLdW4oyxNBbBzlPmHQhccyiAvWwbSnv8JLB-/exec";

export default function OfficialAdmissionDocument() {
  const [formData, setFormData] = useState({
    regDate: new Date().toISOString().slice(0, 10),
    name: "",
    fatherName: "",
    dob: "",
    gender: "पुरुष",
    phone: "",
    altPhone: "",
    course: "",
    exam: "",
    currAddress: "",
    permAddress: "",
    pincode: "",
    idProof: "",
  });

  const [sameAddress, setSameAddress] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // E-Signature Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSameAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAddress(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, permAddress: prev.currAddress }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      alert("कृपया नियम एवं शर्तों की घोषणा (Declaration) को स्वीकार करें।");
      return;
    }
    if (!hasSignature) {
      alert("कृपया नीचे बॉक्स में अपना डिजिटल हस्ताक्षर (Signature) बनाएं।");
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
      formBody.append(
        "address",
        `CURR: ${formData.currAddress.trim().toUpperCase()} | PERM: ${(sameAddress ? formData.currAddress : formData.permAddress).trim().toUpperCase()}`
      );
      formBody.append("pincode", formData.pincode.trim());
      formBody.append("idProof", fullAadhaar);
      formBody.append("regDate", formData.regDate);

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody.toString(),
      });

      setSubmitted(true);
    } catch (err) {
      alert("आवेदन जमा करने में समस्या आई, कृपया पुनः प्रयास करें।");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#ece7de] flex items-center justify-center p-4 font-sans select-none">
        <div className="bg-[#fffefb] border-2 border-[#1e3a8a] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner font-black">
            ✓
          </div>
          <h2 className="text-2xl font-black text-[#1e3a8a] tracking-tight">आवेदन सफलतापूर्वक पंजीकृत हुआ!</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-950 font-semibold leading-relaxed">
            आपका आवेदन द्रोणाचार्य लाइब्रेरी के केंद्रीय रिकॉर्ड में दर्ज हो चुका है। कृपया काउंटर डेस्क पर संपर्क करें ताकि आपकी अध्ययन सीट आवंटित कर आधिकारिक शुल्क रसीद जारी की जा सके।
          </div>
          <div className="pt-2 text-neutral-500 text-xs font-bold space-y-0.5">
            <p className="text-neutral-900 font-extrabold uppercase">द्रोणाचार्य लाइब्रेरी</p>
            <p>सम्पर्क सूत्र: 8461929686</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ece7de] py-6 px-3 sm:px-6 flex justify-center items-center font-sans antialiased text-neutral-900">
      {/* Physical Document Outer Frame */}
      <div className="w-full max-w-[820px] bg-[#fffefb] border-[3px] border-[#1e3a8a] rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] p-5 sm:p-9 relative">
        
        {/* Top Header Section matching the Printed Form */}
        <div className="border-b-2 border-[#1e3a8a] pb-4 mb-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full border-2 border-[#1e3a8a] bg-blue-50 flex flex-col items-center justify-center shadow-sm">
                <span className="text-2xl leading-none">🏹</span>
                <span className="text-[7px] font-black uppercase tracking-tighter text-blue-900 mt-0.5">ESTD 2026</span>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-[#1e3a8a] tracking-tight leading-none">
                  द्रोणाचार्य लाइब्रेरी
                </h1>
                <p className="text-[11px] sm:text-xs font-black text-amber-900 tracking-wider uppercase mt-1">
                  DRONACHARYA LIBRARY
                </p>
              </div>
            </div>

            {/* Reg Date Box */}
            <div className="border-2 border-[#1e3a8a] rounded-lg p-2.5 bg-blue-50/50 text-center min-w-[150px]">
              <p className="text-[10px] font-black uppercase text-[#1e3a8a] tracking-wider">Reg. Date</p>
              <input
                type="date"
                required
                value={formData.regDate}
                onChange={(e) => setFormData({ ...formData, regDate: e.target.value })}
                className="bg-transparent text-xs font-black text-neutral-900 text-center focus:outline-none cursor-pointer mt-0.5"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 pt-2 gap-1.5">
            <span className="bg-[#1e3a8a] text-white text-xs sm:text-sm font-black px-4 py-1 rounded-md tracking-wide uppercase shadow-sm">
              सदस्यता आवेदन पत्र (ADMISSION FORM)
            </span>
            <span className="text-[11px] font-extrabold italic text-neutral-600">
              "Where Dedicated Students Turn Dreams into Result"
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* 👤 1. व्यक्तिगत जानकारी (PERSONAL INFORMATION) */}
          <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-[#1e3a8a] text-white px-3.5 py-1.5 flex items-center gap-2 font-black text-xs uppercase tracking-wide">
              <span>👤</span> व्यक्तिगत जानकारी (PERSONAL INFORMATION)
            </div>

            <div className="p-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">नाम (Full Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="छात्र/छात्रा का पूरा नाम दर्ज करें"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-2 text-xs uppercase font-bold text-neutral-900 focus:outline-none focus:border-[#1e3a8a]"
                  />
                </div>

                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">पिता का नाम (Father's Name) *</label>
                  <input
                    type="text"
                    required
                    placeholder="पिताजी का नाम"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value.toUpperCase() })}
                    className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-2 text-xs uppercase font-bold text-neutral-900 focus:outline-none focus:border-[#1e3a8a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">जन्मतिथि (Date of Birth) *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-1.5 text-xs font-semibold text-neutral-900 focus:outline-none focus:border-[#1e3a8a]"
                  />
                </div>

                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">लिंग (Gender) *</label>
                  <div className="flex items-center gap-5 pt-1.5 font-bold text-neutral-800">
                    {["पुरुष", "महिला", "अन्य"].map((g) => (
                      <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="accent-[#1e3a8a] w-4 h-4 cursor-pointer"
                        />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">मोबाइल नंबर (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10 अंकों का व्यक्तिगत नंबर"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                    className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-2 text-xs font-bold tracking-wider text-neutral-900 focus:outline-none focus:border-[#1e3a8a]"
                  />
                </div>

                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">अभिभावक का मोबाइल नंबर (Parents Contact) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="माता / पिता का संपर्क नंबर"
                    value={formData.altPhone}
                    onChange={(e) => setFormData({ ...formData, altPhone: e.target.value.replace(/\D/g, "") })}
                    className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-2 text-xs font-bold tracking-wider text-neutral-900 focus:outline-none focus:border-[#1e3a8a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">कक्षा / कोर्स (Class / Course)</label>
                  <input
                    type="text"
                    placeholder="e.g. B.TECH, B.SC, B.A, 12TH, DIPLOMA"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value.toUpperCase() })}
                    className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-2 text-xs uppercase font-medium text-neutral-900 focus:outline-none focus:border-[#1e3a8a]"
                  />
                </div>

                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">परीक्षा की तैयारी (Exam preparation)</label>
                  <input
                    type="text"
                    placeholder="e.g. UPSC, CGPSC, SSC, RAILWAY, NEET, GATE"
                    value={formData.exam}
                    onChange={(e) => setFormData({ ...formData, exam: e.target.value.toUpperCase() })}
                    className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-2 text-xs uppercase font-medium text-neutral-900 focus:outline-none focus:border-[#1e3a8a]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">वर्तमान पता (Current Address) *</label>
                <input
                  type="text"
                  required
                  placeholder="मकान नं., वार्ड, मोहल्ला, शहर/तहसील"
                  value={formData.currAddress}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setFormData((prev) => ({
                      ...prev,
                      currAddress: val,
                      permAddress: sameAddress ? val : prev.permAddress,
                    }));
                  }}
                  className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-2 text-xs uppercase font-medium text-neutral-900 focus:outline-none focus:border-[#1e3a8a]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-neutral-700 uppercase text-[11px]">स्थायी पता (Permanent Address) *</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-blue-900">
                    <input
                      type="checkbox"
                      checked={sameAddress}
                      onChange={handleSameAddressToggle}
                      className="accent-[#1e3a8a]"
                    />
                    <span>वर्तमान पते के समान (Same as current)</span>
                  </label>
                </div>
                <input
                  type="text"
                  required
                  disabled={sameAddress}
                  placeholder="स्थायी गृह पता दर्ज करें"
                  value={formData.permAddress}
                  onChange={(e) => setFormData({ ...formData, permAddress: e.target.value.toUpperCase() })}
                  className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-2 text-xs uppercase font-medium text-neutral-900 focus:outline-none focus:border-[#1e3a8a] disabled:bg-neutral-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px]">पिनकोड (Pincode) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="6 DIGIT PINCODE"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, "") })}
                    className="w-full bg-[#fcfbf7] border border-neutral-300 rounded-md px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:border-[#1e3a8a]"
                  />
                </div>

                <div>
                  <label className="block font-black text-neutral-700 mb-1 uppercase text-[11px] flex justify-between">
                    <span>आधार नंबर (Aadhar No. - Last 4) *</span>
                    <span className="text-neutral-400 font-normal text-[10px]">XXXX-XXXX-LAST4</span>
                  </label>
                  <div className="flex items-center h-[36px] border border-neutral-300 rounded-md overflow-hidden bg-[#fcfbf7]">
                    <span className="bg-neutral-100 text-neutral-600 px-3 py-2 font-mono text-xs font-bold border-r border-neutral-300 select-none">
                      XXXX-XXXX-
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      placeholder="5678"
                      value={formData.idProof}
                      onChange={(e) => setFormData({ ...formData, idProof: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                      className="w-full bg-transparent px-3 py-1.5 font-mono text-xs font-bold tracking-widest text-neutral-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 📜 2. नियम एवं शर्तें (RULES & CONDITIONS) */}
          <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-[#1e3a8a] text-white px-3.5 py-1.5 flex items-center gap-2 font-black text-xs uppercase tracking-wide">
              <span>📜</span> नियम एवं शर्तें (RULES & CONDITIONS)
            </div>

            <div className="p-4 bg-amber-50/40 space-y-1.5 text-[11px] text-neutral-800 leading-relaxed font-medium">
              <p>1. लाइब्रेरी में शांति एवं अनुशासन बनाए रखना प्रत्येक सदस्य की जिम्मेदारी होगी।</p>
              <p>2. लाइब्रेरी परिसर में किसी भी प्रकार का शोर-शराबा, विवाद या अनुचित व्यवहार वर्जित है।</p>
              <p>3. स्टाफ या अन्य सदस्यों के साथ दुर्व्यवहार करने पर सदस्यता समाप्त की जा सकती है।</p>
              <p>4. लाइब्रेरी की सीट किसी अन्य सदस्य को हस्तांतरित नहीं की जा सकती।</p>
              <p className="font-bold text-red-700">5. शुल्क किसी भी परिस्थिति में वापस (Refund) नहीं किया जाएगा।</p>
              <p>6. पूर्णकालिक (Full Time) सदस्यों को ही लॉकर सुविधा उपलब्ध कराई जाएगी।</p>
              <p>7. लॉकर में रखे गए सामान की सुरक्षा का उचित ध्यान सदस्य स्वयं रखेगा।</p>
              <p>8. आपको लाइब्रेरी की संपत्ति को जानबूझकर क्षतिग्रस्त करने पर क्षतिपूर्ति देना होगा।</p>
              <p>9. लाइब्रेरी के नियमों का बार-बार उल्लंघन करने पर प्रबंधन बिना किसी शुल्क वापसी के सदस्यता समाप्त कर सकता है।</p>
              <p>10. सदस्य द्वारा दी गई सभी जानकारी सत्य होना आवश्यक है। गलत जानकारी पाए जाने पर सदस्यता निरस्त की जा सकती है।</p>
              <p>11. लाइब्रेरी आपके किसी भी निजी सामान के खोने या क्षति के लिए जिम्मेदार नहीं होगी।</p>
              <p className="font-bold text-red-700">12. धूम्रपान, शराब तथा अन्य नशीले पदार्थ पूर्णतः प्रतिबंधित हैं।</p>
            </div>
          </div>

          {/* 🔔 3. महत्वपूर्ण निर्देश (IMPORTANT INSTRUCTIONS) */}
          <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-slate-800 text-white px-3.5 py-1.5 flex items-center gap-2 font-black text-xs uppercase tracking-wide">
              <span>🔔</span> महत्वपूर्ण निर्देश (IMPORTANT INSTRUCTIONS)
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-neutral-800 font-semibold bg-neutral-50/60">
              <p className="flex items-center gap-2">
                <span>🔕</span> मोबाइल फोन Silent Mode पर रखें और कॉल केवल निर्धारित स्थान पर करें।
              </p>
              <p className="flex items-center gap-2">
                <span>⏱️</span> प्रवेश समय का पालन करें एवं समय पर लाइब्रेरी छोड़ें।
              </p>
              <p className="flex items-center gap-2">
                <span>🧹</span> अपनी सीट साफ-सुथरी रखें और कुर्सी / टेबल को व्यवस्थित रखें।
              </p>
              <p className="flex items-center gap-2">
                <span>🎒</span> अपनी पुस्तकों, मोबाइल और अन्य कीमती सामान की सुरक्षा स्वयं करें।
              </p>
            </div>
          </div>

          {/* ✍️ 4. घोषणा एवं डिजिटल हस्ताक्षर (DECLARATION & SIGNATURE) */}
          <div className="border-2 border-neutral-400 rounded-lg p-4 bg-white space-y-4">
            <div>
              <h4 className="font-black text-xs uppercase text-neutral-900 mb-2 flex items-center gap-2">
                <span>✅</span> घोषणा (DECLARATION)
              </h4>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#1e3a8a] cursor-pointer"
                />
                <span className="text-[11px] font-bold text-neutral-900 leading-snug">
                  मैं घोषणा करता/करती हूँ कि मेरे द्वारा दी गई सभी जानकारी सत्य है तथा मैंने लाइब्रेरी के सभी नियमों एवं शर्तों को पढ़ा है तथा उनका पालन करने के लिए पूर्णतः सहमत हूँ।
                </span>
              </label>
            </div>

            {/* Signature Area */}
            <div className="pt-3 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div className="border-t-2 border-dashed border-neutral-400 pt-2 text-center select-none opacity-70">
                <p className="text-xs font-black text-neutral-800">Dronacharya Admin</p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-0.5">Signature of Owner / Desk</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-blue-900">
                    आवेदक का हस्ताक्षर (Sign Here) *
                  </span>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[10px] text-red-600 font-bold hover:underline"
                  >
                    Clear (हटाएं)
                  </button>
                </div>

                <div className="w-full border-2 border-[#1e3a8a] rounded-lg bg-[#fafafd] overflow-hidden shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={320}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[110px] cursor-crosshair touch-none"
                  />
                </div>
                <p className="text-[9px] font-bold text-neutral-500 uppercase mt-1">
                  Signature of Student
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#1e3a8a] hover:bg-blue-900 text-white font-black text-sm rounded-xl shadow-lg transition duration-200 uppercase tracking-wider disabled:bg-neutral-400 cursor-pointer"
            >
              {submitting ? "पंजीकरण दर्ज हो रहा है..." : "आवेदन पत्र जमा करें (SUBMIT ADMISSION FORM)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}