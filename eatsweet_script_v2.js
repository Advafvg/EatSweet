// eatsweet_script_v2.js — improved cart logic with autofill, safe rendering, and sync
(function () {
  const CART_KEY = "eatsweet_cart_v2";

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [] };
    } catch (e) {
      return { items: [] };
    }
  }
  function setCart(c) {
    localStorage.setItem(CART_KEY, JSON.stringify(c));
  }

  function updateCartUI() {
    const c = getCart();
    const count = (c.items || []).length;
    document
      .querySelectorAll("#cartCount")
      .forEach((el) => (el.textContent = count));
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[m];
    });
  }

  window.addToCart = function (product) {
    const cart = getCart();
    cart.items = cart.items || [];
    cart.items.push(product || { name: "Item", price: 0 });
    setCart(cart);
    updateCartUI();
  };

  window.toggleCart = function () {
    const drawer = document.querySelector(".cart-drawer");
    if (!drawer) return;
    drawer.classList.toggle("open");
    renderCartItems();
    if (drawer.classList.contains("open")) {
      drawer.setAttribute("tabindex", "-1");
      drawer.focus();
    }
  };

  function renderCartItems() {
    const cart = getCart();
    const container = document.querySelector(".cart-items");
    if (!container) return;
    container.innerHTML = "";
    (cart.items || []).forEach((it, idx) => {
      const item = document.createElement("div");
      item.className = "cart-item";
      const img = escapeHtml(
        it.img ||
          "https://images.unsplash.com/photo-1544025162-d76694265947?fit=crop&w=800&q=60"
      );
      const name = escapeHtml(it.name || "Item");
      const price = it.price ? "₹ " + escapeHtml(String(it.price)) : "";
      item.innerHTML = `<img src="${img}" alt="item"><div class="meta"><h4>${name}</h4><div>${price}</div></div><div class="controls"><button data-remove="${idx}">−</button></div>`;
      container.appendChild(item);
    });
    const totalEl = document.querySelector(".cart-footer .total");
    if (totalEl) {
      const sum = (getCart().items || []).reduce(
        (s, i) => s + (Number(i.price) || 0),
        0
      );
      totalEl.textContent = "Total: ₹ " + sum;
    }
    container.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeCartItem(Number(btn.getAttribute("data-remove")));
      });
    });
  }

  window.removeCartItem = function (index) {
    const cart = getCart();
    if (cart.items && cart.items[index]) {
      cart.items.splice(index, 1);
      setCart(cart);
      updateCartUI();
      renderCartItems();
    }
  };

  window.scrollToBestSellers = function () {
    const el = document.getElementById("bestsellers");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  window.prevPremium = function () {
    const track = document.getElementById("premiumTrack");
    if (!track) return;
    const w = track.firstElementChild
      ? track.firstElementChild.getBoundingClientRect().width + 18
      : 300;
    window.__premiumOffset = Math.max(0, window.__premiumOffset - w);
    track.style.transform = `translateX(-${window.__premiumOffset}px)`;
  };
  window.nextPremium = function () {
    const track = document.getElementById("premiumTrack");
    if (!track) return;
    const w = track.firstElementChild
      ? track.firstElementChild.getBoundingClientRect().width + 18
      : 300;
    window.__premiumOffset = window.__premiumOffset + w;
    track.style.transform = `translateX(-${window.__premiumOffset}px)`;
  };

  function autofillProductMeta() {
    document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      if (btn.dataset.name) return;
      const card =
        btn.closest(".product-card") ||
        btn.closest(".menu-item") ||
        btn.closest('[class*="product"]');
      if (!card) return;
      const nameEl =
        card.querySelector("h4") ||
        card.querySelector("h3") ||
        card.querySelector("h2");
      const priceEl =
        card.querySelector(".price") ||
        card.querySelector(".item-price") ||
        Array.from(card.querySelectorAll("div")).find((d) =>
          /₹\s*\d+/.test(d.textContent)
        );
      const imgEl = card.querySelector("img");
      const name = nameEl ? nameEl.innerText.trim() : "Item";
      let price = 0;
      if (priceEl) {
        const m = priceEl.textContent.match(/(\d+[\d,]*)/);
        if (m) price = parseInt(m[1].replace(/,/g, ""), 10);
      }
      const img = imgEl ? imgEl.src : "";
      btn.dataset.name = name;
      btn.dataset.price = price;
      btn.dataset.img = img;
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    autofillProductMeta();
    updateCartUI();
    document.querySelectorAll("[data-add-to-cart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const meta = btn.dataset || {};
        addToCart({
          name: meta.name || "Item",
          price: meta.price ? Number(meta.price) : 0,
          img: meta.img,
        });
      });
    });
    document
      .getElementById("prevPremium")
      ?.addEventListener("click", prevPremium);
    document
      .getElementById("nextPremium")
      ?.addEventListener("click", nextPremium);
    window.addEventListener("storage", (e) => {
      if (e.key === CART_KEY) updateCartUI();
    });
  });
})();
