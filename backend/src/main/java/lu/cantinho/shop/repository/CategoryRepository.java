package lu.cantinho.shop.repository;

import lu.cantinho.shop.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByOrderByPositionAscIdAsc();
}
