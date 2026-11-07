package lu.cantinho.shop.repository;

import lu.cantinho.shop.entity.ShopOrder;
import lu.cantinho.shop.entity.Enums;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {
    Optional<ShopOrder> findByCode(String code);
    boolean existsByCode(String code);
    List<ShopOrder> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ShopOrder> findByStatusInOrderByScheduledAtAsc(Collection<Enums.OrderStatus> statuses);
    List<ShopOrder> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime from);
    List<ShopOrder> findTop200ByOrderByCreatedAtDesc();
    long countByStatusIn(Collection<Enums.OrderStatus> statuses);
    List<ShopOrder> findByScheduledAtGreaterThanEqualAndStatusInOrderByScheduledAtAsc(LocalDateTime from, Collection<Enums.OrderStatus> statuses);
    long countByScheduledAtAndStatusNot(LocalDateTime scheduledAt, Enums.OrderStatus status);
}
