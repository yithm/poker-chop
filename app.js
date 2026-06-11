// ===== 초기화 =====

const playerCountEl = document.getElementById("playerCount");
const playerInputsEl = document.getElementById("playerInputs");
const payoutInputsEl = document.getElementById("payoutInputs");

const calculateBtn = document.getElementById("calculateBtn");
const resultsSection = document.getElementById("resultsSection");
const resultsEl = document.getElementById("results");
const totalPaidEl = document.getElementById("totalPaid");

const payoutStructureSection =
document.getElementById("payoutStructureSection");

const totalPrizeSection =
document.getElementById("totalPrizeSection");

const copyBtn = document.getElementById("copyBtn");

const modeRadios =
document.querySelectorAll('input[name="mode"]');

// ===== 유틸 =====

function numberFormat(n){
    return Math.round(n).toLocaleString();
}

function getMode(){
    return document.querySelector(
        'input[name="mode"]:checked'
    ).value;
}
function addComma(value){
    value = value.replace(/,/g,"");
    if(!value) return "";
    return Number(value).toLocaleString();
}

function removeComma(value){
    return Number(
        value.replace(/,/g,"")
    ) || 0;
}
// ===== 입력 UI 생성 =====

function renderPlayerInputs(){

    const count =
    parseInt(playerCountEl.value);

    const existingValues = {};

    document
    .querySelectorAll(
        "#playerInputs input"
    )
    .forEach(input=>{
        existingValues[input.id] =
        input.value;
    });

    let html = "";

    for(let i=1;i<=count;i++){

        html += `
        <div class="player-card">

<input
    type="text"

    id="name${i}"

    class="player-title-input"

    placeholder="플레이어 ${i}"

    autocomplete="off"
    autocorrect="off"
    spellcheck="false"
    autocapitalize="off"

    value="${
        existingValues[`name${i}`]
        || ""
    }"
/>

            <input
                type="text"
                inputmode="numeric"
                id="chip${i}"
                placeholder="칩 입력"
                value="${
               existingValues[`chip${i}`]
                || ""
                  }"
              >

        </div>
        `;
    }

    playerInputsEl.innerHTML = html;
}

function renderPayoutInputs(){

    const count =
    parseInt(playerCountEl.value);

    const existingValues = {};

    document
    .querySelectorAll(
        "#payoutInputs input"
    )
    .forEach(input=>{
        existingValues[input.id] =
        input.value;
    });

    let html = "";
    for(let i=1;i<=count;i++){

     html += `
<div class="payout-row">

    <label>${i}등</label>

    <input
        type="text"
        inputmode="numeric"
        id="pay${i}"
        placeholder="상금 입력"
        value="${existingValues[`pay${i}`] || ""}"
    >

</div>
`;
    }

    payoutInputsEl.innerHTML = html;
}

function updateMode(){

    const mode = getMode();

    if(mode === "icm"){

        payoutStructureSection
        .classList.remove("hidden");

        totalPrizeSection
        .classList.add("hidden");

    }else{

        payoutStructureSection
        .classList.add("hidden");

        totalPrizeSection
        .classList.remove("hidden");
    }

    renderPayoutInputs();
}
playerCountEl.addEventListener(
    "change",
    ()=>{
        renderPlayerInputs();
        renderPayoutInputs();
    }
);

modeRadios.forEach(r=>{
    r.addEventListener(
        "change",
        updateMode
    );
});

// ===== 진짜 ICM =====

function calculateICM(stacks, payouts){

    const memo = new Map();

    function recurse(players, prizes){

        const key =
        players.join(",")
        + "|"
        + prizes.join(",");

        if(memo.has(key)){
            return memo.get(key);
        }

        const result =
        Array(stacks.length).fill(0);

        if(prizes.length === 0){
            memo.set(key,result);
            return result;
        }

        const totalStack =
        players.reduce(
            (a,p)=>a+stacks[p],
            0
        );

        for(const player of players){

            const prob =
            stacks[player]
            /
            totalStack;

            result[player] +=
            prob * prizes[0];

            const remaining =
            recurse(
                players.filter(
                    p=>p!==player
                ),
                prizes.slice(1)
            );

            for(
                let i=0;
                i<result.length;
                i++
            ){
                result[i] +=
                prob * remaining[i];
            }
        }

        memo.set(key,result);

        return result;
    }

    const players =
    stacks.map((_,i)=>i);

    return recurse(
        players,
        payouts
    );
}

// ===== Chip Chop =====

function calculateChipChop(
    stacks,
    totalPrize
){

    const total =
    stacks.reduce((a,b)=>a+b,0);

    let payouts =
    stacks.map(s=>
        Math.floor(
            (
                totalPrize
                *
                s
                /
                total
            )/100
        )*100
    );

    const used =
    payouts.reduce(
        (a,b)=>a+b,
        0
    );

    const remain =
    totalPrize - used;

    const leader =
    stacks.indexOf(
        Math.max(...stacks)
    );

    payouts[leader] += remain;

    return payouts;
}

// ===== 결과 출력 =====

function renderResults(stacks, payouts){

    const totalStack = stacks.reduce((a,b)=>a+b,0);

    const rows = stacks.map((chips,index)=>({

        name: document.getElementById(`name${index+1}`).value || `플레이어 ${index+1}`,
        chips,
        payout: payouts[index],
        pct: totalStack ? (chips / totalStack * 100) : 0
    }));

    // 칩 많은 순 정렬 (OK)
    rows.sort((a,b)=>b.chips - a.chips);

    let html = "";

    rows.forEach((r,index)=>{

        let medal = "🏅";
        if(index===0) medal="🥇";
        if(index===1) medal="🥈";
        if(index===2) medal="🥉";

        html += `
<div class="result-card">

    <div class="result-name">
        ${medal} ${index + 1}등 ${r.name}
    </div>

    <div class="result-row">
        <span>칩</span>
        <span class="result-value">
            ${numberFormat(r.chips)}
        </span>
    </div>

    <div class="result-row">
        <span>점유율</span>
        <span class="result-value">
            ${r.pct.toFixed(1)}%
        </span>
    </div>

    <div class="result-row">
        <span>상금</span>
        <span class="result-value">
            ${numberFormat(r.payout)}원
        </span>
    </div>

    <div class="bar-wrap">
        <div class="bar" style="width:${r.pct}%"></div>
    </div>

</div>
`;
    });

    resultsEl.innerHTML = html;

    const totalPaid = payouts.reduce((a,b)=>a+b,0);
    totalPaidEl.innerText = numberFormat(totalPaid) + "원";

    resultsSection.classList.remove("hidden");
}
// ===== 계산 버튼 =====

calculateBtn.addEventListener(
    "click",
    ()=>{

        const count =
        removeComma(
            playerCountEl.value
        );

        let stacks = [];

        for(
            let i=1;
            i<=count;
            i++
        ){

            stacks.push(
                removeComma(
                document.getElementById(
                `chip${i}`
                ).value
                ) || 0
            );
        }

        if(
            stacks.reduce(
                (a,b)=>a+b,
                0
            ) === 0
        ){
            alert(
                "칩을 입력하세요."
            );
            return;
        }

        let payouts = [];

        if(
            getMode()
            === "chip"
        ){

const totalPrize =
removeComma(
    document.getElementById("totalPrize")?.value || ""
) || 0;

if(totalPrize <= 0){
    alert("총 상금을 입력하세요.");
    return;
}

payouts =
calculateChipChop(
    stacks,
    totalPrize
);
        }else{

            let prizes = [];

            for(
                let i=1;
                i<=count;
                i++
            ){

                prizes.push(
                    removeComma(
                        document.getElementById(
                            `pay${i}`
                        ).value
                    ) || 0
                );
            }
 // 1등 상금 체크
    if(prizes[0] <= 0){
        alert("1등 상금을 입력하세요.");
        return;
    }

    const totalPrizePool =
    prizes.reduce((a,b)=>a+b,0);

    if(totalPrizePool <= 0){
        alert("상금 구조를 입력하세요.");
        return;
    }

            payouts =
            calculateICM(
                stacks,
                prizes
            );

            payouts =
            payouts.map(
                p=>
                Math.round(
                    p/100
                )*100
            );

            const target =
            prizes.reduce(
                (a,b)=>a+b,
                0
            );

            const used =
            payouts.reduce(
                (a,b)=>a+b,
                0
            );

            const leader =
            stacks.indexOf(
                Math.max(...stacks)
            );

            payouts[leader] +=
            target-used;
        }

        renderResults(
            stacks,
            payouts
        );
        resultsSection.classList.remove("hidden");
    }
);

// ===== 결과 복사 =====
copyBtn.addEventListener("click", ()=>{

    const cards = document.querySelectorAll(".result-card");

    const mode = getMode() === "chip" ? "Chip Chop" : "ICM Chop";

    let text = "♠ 포커룰루 딜 결과 ♠\n\n";
    text += `계산방식 : ${mode}\n\n`;

    cards.forEach((card,index)=>{

         const name = card.querySelector(".result-name").innerText
        .replace(/[🥇🥈🥉]/g, "")
        .replace(/\d+등/g, "")
        .trim();
        const payout = Number(card.dataset.payout || 0);
        let medal = "🏅";
        if(index===0) medal="🥇";
        if(index===1) medal="🥈";
        if(index===2) medal="🥉";

        text += `${medal} ${name} - ${Number(payout).toLocaleString()}원\n`;
    });

    text += "\n━━━━━━━━━\n";
    text += `총 지급액 ${totalPaidEl.innerText}`;

    navigator.clipboard.writeText(text);
    alert("결과가 복사되었습니다.");
});
// ===== 시작 =====
document.addEventListener("input", (e)=>{

  if(
    e.target.id.startsWith("chip")
    ||
    e.target.id.startsWith("pay")
    ||
    e.target.id === "totalPrize"
){

        const raw =
        e.target.value
            .replace(/,/g,"")
            .replace(/[^0-9]/g,"");

        e.target.value =
        addComma(raw);
    }
});
renderPlayerInputs();
renderPayoutInputs();
updateMode();

