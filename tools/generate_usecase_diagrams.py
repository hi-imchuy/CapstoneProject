from __future__ import annotations

from dataclasses import dataclass
from math import atan2, cos, sin, sqrt
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path(r"D:\Ki10\BaoCao\Img")
INK = (22, 34, 50)
GRAY = (120, 128, 140)
WHITE = (255, 255, 255)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        r"C:\Windows\Fonts\timesbd.ttf" if bold else r"C:\Windows\Fonts\times.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


TITLE = font(36, True)
SUBTITLE = font(24, True)
TEXT = font(22)
SMALL = font(17)


@dataclass
class Oval:
    key: str
    text: str
    cx: int
    cy: int
    w: int = 270
    h: int = 74

    @property
    def box(self) -> tuple[int, int, int, int]:
        return (self.cx - self.w // 2, self.cy - self.h // 2, self.cx + self.w // 2, self.cy + self.h // 2)


@dataclass
class Actor:
    key: str
    text: str
    x: int
    y: int


class Canvas:
    def __init__(self, title: str, width: int = 1500, height: int = 980):
        self.scale = 2
        self.width = width
        self.height = height
        self.img = Image.new("RGB", (width * self.scale, height * self.scale), WHITE)
        self.draw = ImageDraw.Draw(self.img)
        self.title = title
        self.actors: dict[str, Actor] = {}
        self.ovals: dict[str, Oval] = {}

    def s(self, v: int | float) -> int:
        return int(round(v * self.scale))

    def line(self, points, fill=INK, width=3, dash: bool = False):
        pts = [(self.s(x), self.s(y)) for x, y in points]
        if not dash:
            self.draw.line(pts, fill=fill, width=self.s(width), joint="curve")
            return
        for (x1, y1), (x2, y2) in zip(points, points[1:]):
            dist = sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            if dist == 0:
                continue
            ux, uy = (x2 - x1) / dist, (y2 - y1) / dist
            pos = 0
            while pos < dist:
                end = min(pos + 12, dist)
                self.draw.line(
                    [(self.s(x1 + ux * pos), self.s(y1 + uy * pos)), (self.s(x1 + ux * end), self.s(y1 + uy * end))],
                    fill=fill,
                    width=self.s(width),
                )
                pos += 22

    def text_center(self, xy, text: str, fnt=TEXT, fill=INK, max_chars: int = 24, spacing: int = 5):
        x, y = xy
        lines = []
        for raw in text.split("\n"):
            lines.extend(wrap(raw, max_chars) or [""])
        metrics = [self.draw.textbbox((0, 0), line, font=fnt) for line in lines]
        heights = [b[3] - b[1] for b in metrics]
        total_h = sum(heights) + spacing * (len(lines) - 1)
        cy = y - total_h / 2
        for line, h in zip(lines, heights):
            box = self.draw.textbbox((0, 0), line, font=fnt)
            self.draw.text((self.s(x - (box[2] - box[0]) / 2), self.s(cy)), line, font=fnt, fill=fill)
            cy += h + spacing

    def header(self):
        self.text_center((self.width / 2, 38), self.title, TITLE, max_chars=80)

    def boundary(self, label: str, box: tuple[int, int, int, int]):
        x1, y1, x2, y2 = box
        self.draw.rounded_rectangle(
            [self.s(x1), self.s(y1), self.s(x2), self.s(y2)],
            radius=self.s(14),
            outline=INK,
            width=self.s(3),
            fill=WHITE,
        )
        self.draw.rectangle([self.s(x1 + 22), self.s(y1 - 12), self.s(x1 + 280), self.s(y1 + 18)], fill=WHITE)
        self.draw.text((self.s(x1 + 34), self.s(y1 - 8)), label, font=SUBTITLE, fill=INK)

    def actor(self, key: str, text: str, x: int, y: int):
        self.actors[key] = Actor(key, text, x, y)
        r = 22
        self.draw.ellipse([self.s(x - r), self.s(y - 80), self.s(x + r), self.s(y - 36)], outline=INK, width=self.s(4))
        self.line([(x, y - 36), (x, y + 38)], width=4)
        self.line([(x - 45, y - 6), (x + 45, y - 6)], width=4)
        self.line([(x, y + 38), (x - 42, y + 92)], width=4)
        self.line([(x, y + 38), (x + 42, y + 92)], width=4)
        self.text_center((x, y + 130), text, SUBTITLE, max_chars=14)

    def oval(self, key: str, text: str, cx: int, cy: int, w: int = 280, h: int = 76):
        item = Oval(key, text, cx, cy, w, h)
        self.ovals[key] = item
        self.draw.ellipse([self.s(v) for v in item.box], outline=INK, width=self.s(3), fill=WHITE)
        self.text_center((cx, cy), text, TEXT, max_chars=max(14, int(w / 13)))

    def actor_to(self, actor_key: str, oval_key: str):
        a = self.actors[actor_key]
        o = self.ovals[oval_key]
        x1 = a.x + (50 if a.x < o.cx else -50)
        y1 = a.y - 2
        x2, y2 = edge_to_oval(x1, y1, o)
        self.line([(x1, y1), (x2, y2)], width=2)

    def actor_line(self, a_key: str, b_key: str):
        a = self.actors[a_key]
        b = self.actors[b_key]
        self.line([(a.x, a.y + 100), (b.x, b.y - 88)], width=2)
        draw_arrow_head(self, a.x, a.y + 100, b.x, b.y - 88)

    def arrow(self, start_key: str, end_key: str, label: str = "", dash: bool = True):
        a = self.ovals[start_key]
        b = self.ovals[end_key]
        sx, sy = edge_to_oval(b.cx, b.cy, a)
        ex, ey = edge_to_oval(a.cx, a.cy, b)
        self.line([(sx, sy), (ex, ey)], width=2, dash=dash)
        draw_arrow_head(self, sx, sy, ex, ey)
        if label:
            self.text_center(((sx + ex) / 2, (sy + ey) / 2 - 13), label, SMALL, max_chars=20)

    def save(self, filename: str):
        self.header()
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        out = OUT_DIR / filename
        self.img = self.img.resize((self.width, self.height), Image.Resampling.LANCZOS)
        self.img.save(out, "PNG", dpi=(220, 220))
        print(out)


def edge_to_oval(x: float, y: float, oval: Oval) -> tuple[float, float]:
    dx = x - oval.cx
    dy = y - oval.cy
    if dx == 0 and dy == 0:
        return oval.cx, oval.cy
    rx, ry = oval.w / 2, oval.h / 2
    t = 1 / sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    return oval.cx + dx * t, oval.cy + dy * t


def draw_arrow_head(c: Canvas, sx: float, sy: float, ex: float, ey: float):
    angle = atan2(ey - sy, ex - sx)
    size = 13
    pts = [
        (ex, ey),
        (ex - size * cos(angle - 0.45), ey - size * sin(angle - 0.45)),
        (ex - size * cos(angle + 0.45), ey - size * sin(angle + 0.45)),
    ]
    c.draw.polygon([(c.s(x), c.s(y)) for x, y in pts], fill=INK)


def overview():
    c = Canvas("SƠ ĐỒ USE CASE TỔNG QUAN", 1600, 1050)
    c.boundary("Hệ thống hỗ trợ da liễu", (300, 105, 1300, 950))
    c.actor("user", "Người dùng", 150, 210)
    c.actor("patient", "Bệnh nhân", 150, 610)
    c.actor("doctor", "Bác sĩ", 1450, 610)
    positions = [
        ("register", "Đăng ký tài khoản", 560, 205, 290, 82),
        ("login", "Đăng nhập", 800, 320, 250, 78),
        ("forgot", "Khôi phục mật khẩu OTP", 1040, 205, 320, 82),
        ("profile", "Quản lý hồ sơ cá nhân", 560, 440, 315, 82),
        ("ai", "Sử dụng chatbot AI", 1040, 440, 300, 82),
        ("detect", "Nhận diện bệnh da liễu", 560, 630, 320, 82),
        ("history", "Quản lý lịch sử nhận diện", 560, 790, 335, 82),
        ("contact", "Liên hệ bác sĩ", 800, 885, 260, 76),
        ("patients", "Xem danh sách bệnh nhân", 1040, 630, 320, 82),
        ("reply", "Trả lời hội thoại", 1040, 790, 280, 78),
        ("chat", "Trò chuyện trực tiếp", 1040, 885, 300, 76),
    ]
    for args in positions:
        c.oval(*args)
    c.actor_line("user", "patient")
    c.actor_line("user", "doctor")
    for key in ["register", "login", "forgot", "profile", "ai"]:
        c.actor_to("user", key)
    for key in ["detect", "history", "contact"]:
        c.actor_to("patient", key)
    for key in ["patients", "reply", "chat"]:
        c.actor_to("doctor", key)
    c.arrow("history", "detect", "<<include>>")
    c.arrow("contact", "chat", "<<include>>")
    c.arrow("reply", "chat", "<<include>>")
    c.save("hinh-2-2-use-case-tong-quan.png")


def account():
    c = Canvas("SƠ ĐỒ USE CASE QUẢN LÝ TÀI KHOẢN VÀ QUÊN MẬT KHẨU", 1550, 1020)
    c.boundary("Hệ thống tài khoản", (250, 100, 1305, 925))
    c.actor("user", "Người dùng", 120, 490)
    items = [
        ("register", "Đăng ký tài khoản", 500, 185, 310, 82),
        ("login", "Đăng nhập", 790, 185, 260, 78),
        ("refresh", "Làm mới access token", 1080, 185, 320, 82),
        ("logout", "Đăng xuất", 790, 315, 255, 76),
        ("profile", "Quản lý hồ sơ", 500, 450, 290, 80),
        ("display", "Cập nhật tên hiển thị", 500, 590, 325, 82),
        ("avatar", "Cập nhật ảnh đại diện", 500, 730, 325, 82),
        ("password", "Đổi mật khẩu", 500, 865, 260, 76),
        ("forgot", "Khôi phục mật khẩu OTP", 1045, 450, 335, 82),
        ("email", "Nhập email đã đăng ký", 1045, 590, 325, 82),
        ("otp", "Nhận và xác nhận OTP", 1045, 730, 325, 82),
        ("reset", "Tạo mật khẩu mới", 1045, 865, 300, 76),
    ]
    for args in items:
        c.oval(*args)
    for key in ["register", "login", "logout", "profile", "forgot"]:
        c.actor_to("user", key)
    c.arrow("refresh", "login", "<<extend>>")
    c.arrow("display", "profile", "<<extend>>")
    c.arrow("avatar", "profile", "<<extend>>")
    c.arrow("password", "profile", "<<extend>>")
    c.arrow("forgot", "email", "<<include>>")
    c.arrow("forgot", "otp", "<<include>>")
    c.arrow("forgot", "reset", "<<include>>")
    c.save("hinh-2-3-use-case-quan-ly-tai-khoan.png")


def detection():
    c = Canvas("SƠ ĐỒ USE CASE NHẬN DIỆN BỆNH DA LIỄU", 1550, 1020)
    c.boundary("Phân hệ nhận diện", (250, 100, 1305, 925))
    c.actor("patient", "Bệnh nhân", 120, 490)
    c.actor("ai", "Python Server AI", 1415, 390)
    c.actor("cloud", "Cloudinary", 1415, 690)
    items = [
        ("select", "Chọn hoặc kéo thả ảnh", 500, 180, 325, 82),
        ("preview", "Xem ảnh preview", 500, 310, 300, 78),
        ("send", "Gửi yêu cầu nhận diện", 500, 440, 330, 82),
        ("format", "Kiểm tra định dạng ảnh", 825, 310, 325, 82),
        ("upload", "Upload ảnh gốc", 825, 440, 285, 76),
        ("infer", "Suy luận RF-DETR", 1100, 440, 285, 76),
        ("result", "Xem ảnh kết quả khoanh vùng", 500, 600, 350, 88),
        ("pred", "Xem danh sách dự đoán", 500, 740, 325, 82),
        ("zoom", "Mở hoặc phóng to ảnh", 825, 700, 325, 82),
        ("history", "Xem lịch sử nhận diện", 500, 875, 325, 82),
        ("delete", "Xóa một mục lịch sử", 825, 875, 315, 78),
        ("cleanup", "Xóa ảnh và bản ghi", 1100, 875, 300, 76),
    ]
    for args in items:
        c.oval(*args)
    for key in ["select", "send", "result", "history", "delete"]:
        c.actor_to("patient", key)
    c.actor_to("ai", "infer")
    c.actor_to("cloud", "upload")
    c.actor_to("cloud", "cleanup")
    c.arrow("send", "format", "<<include>>")
    c.arrow("send", "upload", "<<include>>")
    c.arrow("send", "infer", "<<include>>")
    c.arrow("result", "pred", "<<include>>")
    c.arrow("zoom", "result", "<<extend>>")
    c.arrow("delete", "cleanup", "<<include>>")
    c.save("hinh-2-4-use-case-nhan-dien-benh-da-lieu.png")


def chatbot():
    c = Canvas("SƠ ĐỒ USE CASE CHATBOT AI", 1500, 980)
    c.boundary("Phân hệ chatbot AI", (270, 100, 1240, 890))
    c.actor("user", "Người dùng", 120, 490)
    c.actor("rag", "Python Server RAG", 1380, 590)
    items = [
        ("list", "Xem danh sách hội thoại AI", 540, 200, 350, 84),
        ("create", "Tạo hội thoại AI", 870, 200, 300, 78),
        ("rename", "Đổi tên hội thoại", 870, 335, 300, 78),
        ("history", "Xem lịch sử tin nhắn", 540, 335, 320, 80),
        ("ask", "Gửi câu hỏi", 540, 520, 270, 76),
        ("answer", "Nhận câu trả lời RAG", 870, 520, 335, 82),
        ("mode", "Xác định mode theo vai trò", 540, 690, 360, 82),
        ("retrieve", "Truy xuất kho tri thức", 870, 690, 330, 82),
        ("clear", "Làm sạch hội thoại", 705, 820, 310, 78),
    ]
    for args in items:
        c.oval(*args)
    for key in ["list", "create", "rename", "history", "ask", "answer", "clear"]:
        c.actor_to("user", key)
    c.actor_to("rag", "retrieve")
    c.actor_to("rag", "answer")
    c.arrow("ask", "mode", "<<include>>")
    c.arrow("answer", "retrieve", "<<include>>")
    c.arrow("answer", "mode", "<<include>>")
    c.save("hinh-2-5-use-case-chatbot-ai.png")


def direct_chat():
    c = Canvas("SƠ ĐỒ USE CASE TRÒ CHUYỆN BÁC SĨ - BỆNH NHÂN", 1550, 1020)
    c.boundary("Phân hệ chat trực tiếp", (250, 100, 1305, 925))
    c.actor("patient", "Bệnh nhân", 120, 500)
    c.actor("doctor", "Bác sĩ", 1425, 500)
    c.actor("socket", "Socket.IO", 1425, 745)
    items = [
        ("contacts", "Xem danh sách đối tượng đối ứng", 540, 190, 380, 88),
        ("open", "Tạo hoặc mở hội thoại", 540, 340, 330, 82),
        ("validate", "Kiểm tra khác vai trò và không trùng chính mình", 900, 340, 390, 94),
        ("messages", "Xem lịch sử tin nhắn", 540, 500, 330, 82),
        ("sendText", "Gửi tin nhắn văn bản", 900, 500, 330, 82),
        ("sendImage", "Gửi tin nhắn hình ảnh", 900, 655, 330, 82),
        ("realtime", "Nhận cập nhật realtime", 1135, 575, 330, 82),
        ("delete", "Xóa một tin nhắn", 540, 820, 300, 78),
        ("clear", "Làm sạch lịch sử hội thoại", 900, 820, 350, 82),
    ]
    for args in items:
        c.oval(*args)
    for actor in ["patient", "doctor"]:
        for key in ["contacts", "open", "messages", "sendText", "sendImage", "delete", "clear"]:
            c.actor_to(actor, key)
    c.actor_to("socket", "realtime")
    c.arrow("open", "validate", "<<include>>")
    c.arrow("sendText", "realtime", "<<include>>")
    c.arrow("sendImage", "realtime", "<<include>>")
    c.save("hinh-2-6-use-case-tro-chuyen-bac-si-benh-nhan.png")


if __name__ == "__main__":
    overview()
    account()
    detection()
    chatbot()
    direct_chat()
