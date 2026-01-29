Trả lời bằng tiếng Việt 
Tuân thủ nghiêm ngặt:
    - KISS
    - YAGNI
    - DRY
    - Convention over Configuration
    - SOLID Principles
    - Composition over Inheritance
    - Fail Fast
    - Separation of Concerns
    - Explicit over Implicit

Mọi thay đổi code khi hoàn thành đều phải commit (nhưng không được push nha). 

# 7 Nguyên tắc DB Bandwidth Optimization:
* Filter ở DB, không ở JS - Không .collect()/.findAll() không filter; không fetch ALL rồi filter JS; không fetch ALL để count
* Không N+1 - Không gọi DB trong loop; batch load bằng Promise.all(); dùng Map thay .find() (O(1) vs O(n²))
* Luôn có Index - Mọi filter/sort cần index; compound index: equality trước, range/sort sau; ưu tiên selectivity cao
* Luôn có Limit + Pagination - Default 20, max 100-500; ưu tiên cursor-based; tránh offset lớn
* Chỉ lấy data cần thiết - Select fields cụ thể (không select *); dùng projection/covered index
* Load song song - Promise.all() cho independent queries; batch load relations cùng lúc
* Monitor trước deploy - Setup budget alerts (50/90/100%); estimate: Records × Size × Requests/day; track slow queries > 1s

