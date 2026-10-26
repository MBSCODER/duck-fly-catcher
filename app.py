"""
Duck Fly Catcher
================
Starring the iconic dark-capped, brown-speckled domestic duck!
Help the duck snap its bill to catch buzzing flies.

Run locally:
    python app.py

Or launch the browser version:
    python app.py --web
"""

import sys
import math
import random
import time
import webbrowser
import os
from pathlib import Path
import tkinter as tk

try:
    import winsound
    HAS_WINSOUND = True
except ImportError:
    HAS_WINSOUND = False


class Fly:
    def __init__(self, canvas_width, canvas_height):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.x = random.choice([0, canvas_width])
        self.y = random.uniform(50, canvas_height - 150)
        self.type = random.choices(["normal", "speedy", "golden"], weights=[0.65, 0.25, 0.10])[0]

        if self.type == "normal":
            self.base_speed = random.uniform(2.5, 4.0)
            self.points = 10
            self.color = "#2c3e50"
            self.size = 5
        elif self.type == "speedy":
            self.base_speed = random.uniform(4.5, 6.5)
            self.points = 25
            self.color = "#c0392b"
            self.size = 4
        else: # golden
            self.base_speed = random.uniform(3.0, 5.0)
            self.points = 50
            self.color = "#f1c40f"
            self.size = 7

        self.angle = random.uniform(0, 2 * math.pi)
        self.vx = math.cos(self.angle) * self.base_speed
        self.vy = math.sin(self.angle) * self.base_speed
        self.wing_phase = random.uniform(0, math.pi * 2)

    def update(self):
        # Organic erratic buzzing
        self.angle += random.uniform(-0.4, 0.4)
        self.vx = 0.85 * self.vx + 0.15 * math.cos(self.angle) * self.base_speed
        self.vy = 0.85 * self.vy + 0.15 * math.sin(self.angle) * self.base_speed

        self.x += self.vx
        self.y += self.vy
        self.wing_phase += 0.8

        # Screen bounce
        if self.x < 20 and self.vx < 0:
            self.vx *= -1
            self.angle = 0
        elif self.x > self.canvas_width - 20 and self.vx > 0:
            self.vx *= -1
            self.angle = math.pi
        if self.y < 40 and self.vy < 0:
            self.vy *= -1
        elif self.y > self.canvas_height - 120 and self.vy > 0:
            self.vy *= -1


class FloatingText:
    def __init__(self, text, x, y, color="#f1c40f"):
        self.text = text
        self.x = x
        self.y = y
        self.color = color
        self.alpha = 1.0
        self.life = 25

    def update(self):
        self.y -= 1.5
        self.life -= 1


class DuckGame:
    def __init__(self, root):
        self.root = root
        self.root.title("Duck Fly Catcher - Starring the Dark-Capped Duck")
        self.root.resizable(False, False)

        self.width = 900
        self.height = 620
        self.canvas = tk.Canvas(root, width=self.width, height=self.height, bg="#1a252f", highlightthickness=0)
        self.canvas.pack()

        # Duck position and animation states
        self.duck_body_x = 220
        self.duck_body_y = 440
        self.target_x = self.width // 2
        self.target_y = self.height // 2
        self.neck_stretch = 0.0  # 0 to 1
        self.beak_open = 0.0     # 0 to 1
        self.is_snapping = False
        self.snap_timer = 0

        # Game state
        self.score = 0
        self.flies_caught = 0
        self.combo = 0
        self.time_left = 60
        self.game_active = True
        self.character = "speckles"  # "speckles" (Dark Cap) | "snowy" (White Duck)
        self.last_tick = time.time()

        self.flies = []
        self.floating_texts = []
        for _ in range(7):
            self.flies.append(Fly(self.width, self.height))

        # Event bindings
        self.canvas.bind("<Motion>", self.on_mouse_move)
        self.canvas.bind("<Button-1>", self.on_click)
        self.root.bind("<space>", self.on_click)
        self.root.bind("<r>", lambda e: self.restart())
        self.root.bind("<R>", lambda e: self.restart())
        self.root.bind("<c>", lambda e: self.toggle_character())
        self.root.bind("<C>", lambda e: self.toggle_character())
        self.root.bind("<Tab>", lambda e: self.toggle_character())

        # Start game loop
        self.update_loop()

    def toggle_character(self):
        self.character = "snowy" if self.character == "speckles" else "speckles"
        self.play_sound("snap")

    def on_mouse_move(self, event):
        self.target_x = event.x
        self.target_y = event.y

    def play_sound(self, sound_type):
        if not HAS_WINSOUND:
            return
        try:
            if sound_type == "snap":
                winsound.Beep(900, 45)
            elif sound_type == "catch":
                winsound.Beep(1200, 60)
            elif sound_type == "combo":
                winsound.Beep(1600, 90)
        except Exception:
            pass

    def on_click(self, event=None):
        if not self.game_active:
            self.restart()
            return

        if not self.is_snapping:
            self.is_snapping = True
            self.snap_timer = 10
            self.check_catch()

    def check_catch(self):
        # Calculate beak tip coordinates
        head_x, head_y, beak_x, beak_y = self.get_head_beak_coords()
        snap_radius = 48
        caught_any = False

        remaining_flies = []
        for fly in self.flies:
            dist = math.hypot(fly.x - beak_x, fly.y - beak_y)
            if dist < snap_radius and not caught_any:
                caught_any = True
                self.combo += 1
                multiplier = min(self.combo, 5)
                earned = fly.points * multiplier
                self.score += earned
                self.flies_caught += 1

                label = f"+{earned}"
                if multiplier > 1:
                    label += f" ({multiplier}x Combo!)"
                self.floating_texts.append(FloatingText(label, fly.x, fly.y, fly.color))

                if multiplier > 1:
                    self.play_sound("combo")
                else:
                    self.play_sound("catch")
                # Respawn fly
                remaining_flies.append(Fly(self.width, self.height))
            else:
                remaining_flies.append(fly)

        self.flies = remaining_flies

        if not caught_any:
            self.combo = 0
            self.play_sound("snap")

    def get_head_beak_coords(self):
        # Neck stretch towards target
        dx = self.target_x - self.duck_body_x
        dy = self.target_y - (self.duck_body_y - 70)
        dist = math.hypot(dx, dy)
        angle = math.atan2(dy, dx)

        # Restrict neck reach
        reach = min(max(dist * 0.45, 60), 160)
        if self.is_snapping:
            reach += 25

        head_x = self.duck_body_x + math.cos(angle) * reach
        head_y = (self.duck_body_y - 60) + math.sin(angle) * reach

        # Beak points forward from head
        beak_x = head_x + math.cos(angle) * 38
        beak_y = head_y + math.sin(angle) * 38

        return head_x, head_y, beak_x, beak_y

    def restart(self):
        self.score = 0
        self.flies_caught = 0
        self.combo = 0
        self.time_left = 60
        self.game_active = True
        self.flies = [Fly(self.width, self.height) for _ in range(7)]
        self.floating_texts.clear()

    def update_loop(self):
        now = time.time()
        dt = now - self.last_tick
        self.last_tick = now

        if self.game_active:
            self.time_left -= dt
            if self.time_left <= 0:
                self.time_left = 0
                self.game_active = False

            # Update flies
            for fly in self.flies:
                fly.update()

            # Ensure minimum number of flies
            while len(self.flies) < 7:
                self.flies.append(Fly(self.width, self.height))

            # Snap animation state
            if self.is_snapping:
                self.snap_timer -= 1
                if self.snap_timer > 5:
                    self.beak_open = 1.0
                elif self.snap_timer > 0:
                    self.beak_open = 0.2
                else:
                    self.beak_open = 0.0
                    self.is_snapping = False

            # Floating text update
            for ft in list(self.floating_texts):
                ft.update()
                if ft.life <= 0:
                    self.floating_texts.remove(ft)

        self.draw()
        self.root.after(20, self.update_loop)

    def draw(self):
        self.canvas.delete("all")

        # 1. Background (Evening Balcony Scene matching photo)
        self.canvas.create_rectangle(0, 0, self.width, self.height, fill="#0d1b2a")
        # Stars / ambient specs
        for i in range(25):
            sx = (i * 37) % self.width
            sy = (i * 23) % (self.height // 2)
            self.canvas.create_oval(sx, sy, sx + 2, sy + 2, fill="#ecf0f1")

        # Distant balcony wall & railing
        self.canvas.create_rectangle(0, self.height - 210, self.width, self.height - 180, fill="#2c3e50")
        for rx in range(40, self.width, 70):
            self.canvas.create_line(rx, self.height - 270, rx, self.height - 180, fill="#34495e", width=4)
        self.canvas.create_line(0, self.height - 270, self.width, self.height - 270, fill="#34495e", width=6)

        # Balcony floor / cloth (matching photos)
        self.canvas.create_polygon(
            0, self.height - 180,
            self.width, self.height - 180,
            self.width, self.height,
            0, self.height,
            fill="#d6dbdf"
        )
        self.canvas.create_line(0, self.height - 180, self.width, self.height - 180, fill="#bdc3c7", width=3)

        # 2. Draw Flies
        for fly in self.flies:
            # Wings
            wing_w = 7 * math.sin(fly.wing_phase)
            self.canvas.create_oval(fly.x - 4, fly.y - 7 + wing_w, fly.x + 4, fly.y - 1, fill="#ecf0f1", outline="")
            self.canvas.create_oval(fly.x - 4, fly.y + 1, fly.x + 4, fly.y + 7 - wing_w, fill="#ecf0f1", outline="")
            # Body
            self.canvas.create_oval(
                fly.x - fly.size, fly.y - fly.size,
                fly.x + fly.size, fly.y + fly.size,
                fill=fly.color, outline="#ffffff" if fly.type == "golden" else ""
            )

        # 3. Draw The User's Duck
        self.draw_duck()

        # 4. Floating texts
        for ft in self.floating_texts:
            self.canvas.create_text(ft.x, ft.y, text=ft.text, fill=ft.color, font=("Helvetica", 14, "bold"))

        # 5. UI Overlay
        self.draw_ui()

    def draw_duck(self):
        head_x, head_y, beak_x, beak_y = self.get_head_beak_coords()

        # Orange Webbed Feet
        self.canvas.create_polygon(
            self.duck_body_x - 30, self.duck_body_y + 70,
            self.duck_body_x - 5, self.duck_body_y + 85,
            self.duck_body_x - 50, self.duck_body_y + 85,
            fill="#e67e22", outline="#d35400"
        )
        self.canvas.create_polygon(
            self.duck_body_x + 10, self.duck_body_y + 70,
            self.duck_body_x + 35, self.duck_body_y + 85,
            self.duck_body_x - 10, self.duck_body_y + 85,
            fill="#e67e22", outline="#d35400"
        )

        # Duck Body & Plumage (Speckles vs Snowy)
        if self.character == "snowy":
            # Snowy: Pure white body with subtle gray shading
            self.canvas.create_oval(
                self.duck_body_x - 90, self.duck_body_y - 45,
                self.duck_body_x + 90, self.duck_body_y + 75,
                fill="#ffffff", outline="#d5dbdb", width=2
            )
            # Distinctive dark feather smudge on flank (from photo)
            self.canvas.create_oval(
                self.duck_body_x - 45, self.duck_body_y + 15,
                self.duck_body_x - 20, self.duck_body_y + 35,
                fill="#2c3e50", outline=""
            )
            self.canvas.create_oval(
                self.duck_body_x - 20, self.duck_body_y + 10,
                self.duck_body_x - 10, self.duck_body_y + 20,
                fill="#34495e", outline=""
            )
            # Soft feather texture
            for sx, sy in [(-60, 0), (-30, -10), (0, 15), (30, 0)]:
                self.canvas.create_arc(
                    self.duck_body_x + sx - 8, self.duck_body_y + sy - 4,
                    self.duck_body_x + sx + 8, self.duck_body_y + sy + 4,
                    start=0, extent=180, outline="#e2e8f0", width=2
                )
            # Tail feathers (White)
            self.canvas.create_polygon(
                self.duck_body_x - 85, self.duck_body_y - 20,
                self.duck_body_x - 125, self.duck_body_y - 35,
                self.duck_body_x - 90, self.duck_body_y + 15,
                fill="#f1f5f9", outline="#e2e8f0"
            )
        else:
            # Speckles: Mottled brown & speckled feathers
            self.canvas.create_oval(
                self.duck_body_x - 90, self.duck_body_y - 45,
                self.duck_body_x + 90, self.duck_body_y + 75,
                fill="#8b5a2b", outline="#6e4720", width=2
            )
            speckle_colors = ["#a0522d", "#cd853f", "#f5deb3", "#5c3317"]
            random.seed(42)
            for _ in range(40):
                sx = random.uniform(self.duck_body_x - 70, self.duck_body_x + 70)
                sy = random.uniform(self.duck_body_y - 25, self.duck_body_y + 60)
                col = random.choice(speckle_colors)
                self.canvas.create_arc(sx - 8, sy - 4, sx + 8, sy + 4, start=0, extent=180, outline=col, width=2)
            random.seed()

            # White breast and bib
            self.canvas.create_oval(
                self.duck_body_x + 10, self.duck_body_y - 40,
                self.duck_body_x + 85, self.duck_body_y + 40,
                fill="#fdfefe", outline="#d5dbdb"
            )
            # Tail feathers
            self.canvas.create_polygon(
                self.duck_body_x - 85, self.duck_body_y - 20,
                self.duck_body_x - 125, self.duck_body_y - 35,
                self.duck_body_x - 90, self.duck_body_y + 15,
                fill="#5c3317"
            )

        # Neck (stretching from body to head)
        neck_base_x = self.duck_body_x + 35
        neck_base_y = self.duck_body_y - 30

        # White neck plumage
        self.canvas.create_line(
            neck_base_x, neck_base_y,
            head_x, head_y,
            fill="#fdfefe", width=34, capstyle=tk.ROUND
        )

        # Head Angle
        angle = math.atan2(head_y - neck_base_y, head_x - neck_base_x)

        # Head base (White cheeks)
        self.canvas.create_oval(
            head_x - 24, head_y - 24,
            head_x + 24, head_y + 24,
            fill="#ffffff", outline=""
        )

        if self.character == "speckles":
            # Iconic Dark/Black mottled crown & cap (from the photo!)
            self.canvas.create_arc(
                head_x - 25, head_y - 26,
                head_x + 25, head_y + 15,
                start=40, extent=160,
                fill="#1c2833", outline="#17202a"
            )
            for ox in [-12, -6, 0, 6, 12]:
                self.canvas.create_oval(head_x + ox, head_y - 18, head_x + ox + 5, head_y - 13, fill="#2c3e50")
        else:
            # Snowy: Small crown speck
            self.canvas.create_oval(head_x - 4, head_y - 24, head_x + 4, head_y - 19, fill="#475569")

        # Eye: Bright bead eye with reflection
        eye_x = head_x + math.cos(angle - 0.4) * 10
        eye_y = head_y + math.sin(angle - 0.4) * 10 - 2
        self.canvas.create_oval(eye_x - 4, eye_y - 4, eye_x + 4, eye_y + 4, fill="#17202a")
        self.canvas.create_oval(eye_x - 1, eye_y - 2, eye_x + 2, eye_y + 1, fill="#ffffff")

        # Beak with opening/closing snap animation
        beak_angle = math.atan2(beak_y - head_y, beak_x - head_x)
        gap = 14 * self.beak_open

        # Upper bill
        ub_x1 = head_x + math.cos(beak_angle) * 16
        ub_y1 = head_y + math.sin(beak_angle) * 16 - gap / 2
        ub_tip_x = head_x + math.cos(beak_angle) * 52
        ub_tip_y = head_y + math.sin(beak_angle) * 52 - gap / 2

        bill_color = "#c5a059" if self.character == "snowy" else "#f39c12"
        bill_outline = "#8c6d32" if self.character == "snowy" else "#d68910"

        self.canvas.create_polygon(
            ub_x1, ub_y1 - 6,
            ub_tip_x, ub_tip_y,
            ub_x1, ub_y1 + 4,
            fill=bill_color, outline=bill_outline, width=2
        )

        if self.character == "snowy":
            # Dark smudge running down Snowy's bill (matching photo)
            smudge_mid_x = (ub_x1 + ub_tip_x) / 2
            smudge_mid_y = (ub_y1 + ub_tip_y) / 2
            self.canvas.create_oval(
                smudge_mid_x - 7, smudge_mid_y - 3,
                smudge_mid_x + 7, smudge_mid_y + 3,
                fill="#3a342a", outline=""
            )
        else:
            # Nostril bean mark on bill
            self.canvas.create_oval(ub_x1 + 6, ub_y1 - 2, ub_x1 + 10, ub_y1 + 1, fill="#7e5109")

        # Lower bill
        lb_y1 = head_y + math.sin(beak_angle) * 16 + gap / 2
        lb_tip_y = head_y + math.sin(beak_angle) * 50 + gap / 2
        lower_bill_col = "#b59247" if self.character == "snowy" else "#e67e22"
        self.canvas.create_polygon(
            ub_x1, lb_y1 - 3,
            ub_tip_x - 4, lb_tip_y,
            ub_x1, lb_y1 + 5,
            fill=lower_bill_col, outline=bill_outline, width=1
        )

        # Crosshair / aim helper at target
        self.canvas.create_oval(
            self.target_x - 8, self.target_y - 8,
            self.target_x + 8, self.target_y + 8,
            outline="#e74c3c", width=1
        )

    def draw_ui(self):
        # Top banner
        self.canvas.create_rectangle(15, 15, self.width - 15, 65, fill="#1c2833", outline="#34495e", width=2)

        self.canvas.create_text(
            35, 40,
            text=f"Score: {self.score}",
            anchor="w",
            fill="#f1c40f",
            font=("Helvetica", 16, "bold")
        )

        self.canvas.create_text(
            240, 40,
            text=f"Flies Caught: {self.flies_caught}",
            anchor="w",
            fill="#2ecc71",
            font=("Helvetica", 14, "bold")
        )

        self.canvas.create_text(
            470, 40,
            text=f"Combo: {self.combo}x",
            anchor="w",
            fill="#e67e22",
            font=("Helvetica", 14, "bold")
        )

        char_name = "🦆 Speckles" if self.character == "speckles" else "🦢 Snowy"
        char_color = "#38bdf8" if self.character == "speckles" else "#ffffff"
        self.canvas.create_text(
            630, 40,
            text=f"Duck: {char_name} [C]",
            anchor="w",
            fill=char_color,
            font=("Helvetica", 13, "bold")
        )

        time_color = "#e74c3c" if self.time_left < 10 else "#ecf0f1"
        self.canvas.create_text(
            self.width - 35, 40,
            text=f"Time: {int(self.time_left)}s",
            anchor="e",
            fill=time_color,
            font=("Helvetica", 16, "bold")
        )

        # Instructions hint at bottom
        if self.game_active:
            self.canvas.create_text(
                self.width // 2, self.height - 20,
                text="Move cursor to aim neck | Left-Click to SNAP bill | Press 'C' to Switch Duck | Press 'R' to Restart",
                fill="#bdc3c7",
                font=("Helvetica", 10)
            )
        else:
            # Game Over screen
            self.canvas.create_rectangle(
                self.width // 2 - 220, self.height // 2 - 110,
                self.width // 2 + 220, self.height // 2 + 110,
                fill="#17202a", outline="#f1c40f", width=3
            )
            self.canvas.create_text(
                self.width // 2, self.height // 2 - 60,
                text="TIME'S UP!",
                fill="#e74c3c",
                font=("Helvetica", 24, "bold")
            )
            self.canvas.create_text(
                self.width // 2, self.height // 2 - 15,
                text=f"Final Score: {self.score}  ({self.flies_caught} flies caught)",
                fill="#f1c40f",
                font=("Helvetica", 16, "bold")
            )
            self.canvas.create_text(
                self.width // 2, self.height // 2 + 35,
                text="Click or Press 'R' to Play Again",
                fill="#2ecc71",
                font=("Helvetica", 14, "bold")
            )
            self.canvas.create_text(
                self.width // 2, self.height // 2 + 75,
                text="Great job, duck!",
                fill="#95a5a6",
                font=("Helvetica", 11, "italic")
            )


def main():
    if "--web" in sys.argv:
        html_file = Path(__file__).parent / "index.html"
        print(f"Opening browser version: {html_file.resolve()}")
        webbrowser.open(html_file.resolve().as_uri())
        return

    root = tk.Tk()
    app = DuckGame(root)
    root.mainloop()


if __name__ == "__main__":
    main()
